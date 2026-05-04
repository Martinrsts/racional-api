import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { createUserWithDefaults, seedStocks, TEST_STOCKS } from '../tests/helpers.js';

async function seedTransaction(userId: string, amount: number, executedAt: Date) {
  return request(app)
    .post(`/users/${userId}/transactions`)
    .send({ amount, executedAt: executedAt.toISOString() });
}

async function seedOrder(userId: string, quantity: number, placedAt: Date) {
  await seedStocks();
  return request(app)
    .post(`/users/${userId}/portfolio/orders`)
    .send({ stockIsin: TEST_STOCKS[0].isin, quantity, placedAt: placedAt.toISOString() });
}

describe('GET /users/:userId/operations', () => {
  it('returns empty array when user has no operations', async () => {
    const user = await createUserWithDefaults('ops-empty@example.com');

    const res = await request(app).get(`/users/${user.id}/operations`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns transactions and orders merged and sorted newest first', async () => {
    const user = await createUserWithDefaults('ops-merge@example.com');
    await seedStocks();

    await seedTransaction(user.id, 1000, new Date('2024-01-10T10:00:00.000Z'));
    await seedOrder(user.id, 5, new Date('2024-01-20T10:00:00.000Z'));
    await seedTransaction(user.id, 500, new Date('2024-01-15T10:00:00.000Z'));

    const res = await request(app).get(`/users/${user.id}/operations`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].type).toBe('order');
    expect(res.body[1].type).toBe('transaction');
    expect(res.body[2].type).toBe('transaction');

    const dates = res.body.map((op: { date: string }) => new Date(op.date).getTime());
    expect(dates[0]).toBeGreaterThan(dates[1]);
    expect(dates[1]).toBeGreaterThan(dates[2]);
  });

  it('tagged operations include the correct type-specific fields', async () => {
    const user = await createUserWithDefaults('ops-fields@example.com');
    await seedStocks();

    await seedTransaction(user.id, 200, new Date('2024-02-01T00:00:00.000Z'));
    await seedOrder(user.id, 3, new Date('2024-02-02T00:00:00.000Z'));

    const res = await request(app).get(`/users/${user.id}/operations`);

    expect(res.status).toBe(200);

    const orderOp = res.body.find((op: { type: string }) => op.type === 'order');
    expect(orderOp).toMatchObject({
      type: 'order',
      portfolioId: user.portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 3,
    });

    const txOp = res.body.find((op: { type: string }) => op.type === 'transaction');
    expect(txOp).toMatchObject({
      type: 'transaction',
      accountId: user.accountId,
      amount: '200',
    });
  });

  it('returns 404 when user does not exist', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app).get(`/users/${userId}/operations`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  describe('limit filter', () => {
    it('returns only the last N operations', async () => {
      const user = await createUserWithDefaults('ops-limit@example.com');
      await seedStocks();

      await seedTransaction(user.id, 100, new Date('2024-01-01T00:00:00.000Z'));
      await seedTransaction(user.id, 200, new Date('2024-01-02T00:00:00.000Z'));
      await seedOrder(user.id, 1, new Date('2024-01-03T00:00:00.000Z'));
      await seedTransaction(user.id, 300, new Date('2024-01-04T00:00:00.000Z'));

      const res = await request(app).get(`/users/${user.id}/operations?limit=2`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      // Newest first
      expect(new Date(res.body[0].date).toISOString()).toBe('2024-01-04T00:00:00.000Z');
      expect(new Date(res.body[1].date).toISOString()).toBe('2024-01-03T00:00:00.000Z');
    });

    it('returns 400 when limit is zero', async () => {
      const user = await createUserWithDefaults('ops-limit-zero@example.com');

      const res = await request(app).get(`/users/${user.id}/operations?limit=0`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when limit is negative', async () => {
      const user = await createUserWithDefaults('ops-limit-neg@example.com');

      const res = await request(app).get(`/users/${user.id}/operations?limit=-1`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when limit is not a number', async () => {
      const user = await createUserWithDefaults('ops-limit-str@example.com');

      const res = await request(app).get(`/users/${user.id}/operations?limit=abc`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('from filter', () => {
    it('returns only operations on or after the given date', async () => {
      const user = await createUserWithDefaults('ops-from@example.com');
      await seedStocks();

      await seedTransaction(user.id, 100, new Date('2024-01-01T00:00:00.000Z'));
      await seedOrder(user.id, 1, new Date('2024-01-15T00:00:00.000Z'));
      await seedTransaction(user.id, 300, new Date('2024-02-01T00:00:00.000Z'));

      const res = await request(app).get(
        `/users/${user.id}/operations?from=2024-01-15T00:00:00.000Z`
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(
        res.body.every(
          (op: { date: string }) => new Date(op.date) >= new Date('2024-01-15T00:00:00.000Z')
        )
      ).toBe(true);
    });

    it('returns empty array when no operations fall within the range', async () => {
      const user = await createUserWithDefaults('ops-from-empty@example.com');

      await seedTransaction(user.id, 100, new Date('2024-01-01T00:00:00.000Z'));

      const res = await request(app).get(
        `/users/${user.id}/operations?from=2025-01-01T00:00:00.000Z`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 400 when from is not a valid date', async () => {
      const user = await createUserWithDefaults('ops-from-bad@example.com');

      const res = await request(app).get(`/users/${user.id}/operations?from=not-a-date`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('limit and from combined', () => {
    it('applies both filters together', async () => {
      const user = await createUserWithDefaults('ops-combined@example.com');
      await seedStocks();

      await seedTransaction(user.id, 100, new Date('2024-01-01T00:00:00.000Z'));
      await seedOrder(user.id, 1, new Date('2024-02-01T00:00:00.000Z'));
      await seedTransaction(user.id, 200, new Date('2024-03-01T00:00:00.000Z'));
      await seedOrder(user.id, 2, new Date('2024-04-01T00:00:00.000Z'));

      const res = await request(app).get(
        `/users/${user.id}/operations?from=2024-02-01T00:00:00.000Z&limit=2`
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(
        res.body.every(
          (op: { date: string }) => new Date(op.date) >= new Date('2024-02-01T00:00:00.000Z')
        )
      ).toBe(true);
      // Newest first
      expect(new Date(res.body[0].date).getTime()).toBeGreaterThan(
        new Date(res.body[1].date).getTime()
      );
    });
  });
});
