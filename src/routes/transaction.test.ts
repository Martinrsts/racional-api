import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { transaction } from '../db/schema.js';
import { createUserWithDefaults } from '../tests/helpers.js';

describe('POST /users/:userId/transactions', () => {
  it('creates a transaction and returns 201', async () => {
    const testUser = await createUserWithDefaults('transaction-post@example.com');

    const executedAt = new Date('2024-01-15T10:00:00.000Z');
    const res = await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({ amount: 1000, executedAt: executedAt.toISOString() });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      accountId: testUser.accountId,
      amount: '1000',
    });

    const [row] = await db.select().from(transaction).where(eq(transaction.id, res.body.id));
    expect(row).toBeDefined();
    expect(row.amount).toBe('1000');
  });

  it('handles negative amounts', async () => {
    const testUser = await createUserWithDefaults('transaction-post-neg@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({ amount: -500, executedAt: new Date().toISOString() });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe('-500');
  });

  it('returns 400 when amount is missing', async () => {
    const testUser = await createUserWithDefaults('transaction-post-no-amount@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({ executedAt: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when executedAt is missing', async () => {
    const testUser = await createUserWithDefaults('transaction-post-no-date@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({ amount: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when amount is not a number', async () => {
    const testUser = await createUserWithDefaults('transaction-post-bad-amount@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({ amount: 'not-a-number', executedAt: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 when user has no account', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app)
      .post(`/users/${userId}/transactions`)
      .send({ amount: 1000, executedAt: new Date().toISOString() });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /users/:userId/transactions', () => {
  it('returns transactions for the user', async () => {
    const testUser = await createUserWithDefaults('transaction-get@example.com');

    await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({ amount: 500, executedAt: new Date('2024-01-15T10:00:00.000Z').toISOString() });

    const res = await request(app).get(`/users/${testUser.id}/transactions`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      accountId: testUser.accountId,
      amount: '500',
    });
  });

  it('returns empty array when user has no transactions', async () => {
    const testUser = await createUserWithDefaults('transaction-get-empty@example.com');

    const res = await request(app).get(`/users/${testUser.id}/transactions`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 404 when user has no account', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app).get(`/users/${userId}/transactions`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('limits results when limit query param is provided', async () => {
    const testUser = await createUserWithDefaults('transaction-get-limit@example.com');

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/users/${testUser.id}/transactions`)
        .send({
          amount: (i + 1) * 100,
          executedAt: new Date(
            `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`
          ).toISOString(),
        });
    }

    const res = await request(app).get(`/users/${testUser.id}/transactions?limit=3`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('filters transactions by from date', async () => {
    const testUser = await createUserWithDefaults('transaction-get-from@example.com');

    await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({
        amount: 100,
        executedAt: new Date('2024-01-01T10:00:00.000Z').toISOString(),
      });
    await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({
        amount: 200,
        executedAt: new Date('2024-06-01T10:00:00.000Z').toISOString(),
      });
    await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({
        amount: 300,
        executedAt: new Date('2024-12-01T10:00:00.000Z').toISOString(),
      });

    const res = await request(app).get(`/users/${testUser.id}/transactions?from=2024-06-01`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((t: { amount: string }) => Number(t.amount) >= 200)).toBe(true);
  });

  it('returns results ordered by executedAt descending', async () => {
    const testUser = await createUserWithDefaults('transaction-get-order@example.com');

    await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({
        amount: 100,
        executedAt: new Date('2024-01-01T10:00:00.000Z').toISOString(),
      });
    await request(app)
      .post(`/users/${testUser.id}/transactions`)
      .send({
        amount: 200,
        executedAt: new Date('2024-03-01T10:00:00.000Z').toISOString(),
      });

    const res = await request(app).get(`/users/${testUser.id}/transactions`);

    expect(res.status).toBe(200);
    expect(res.body[0].amount).toBe('200');
    expect(res.body[1].amount).toBe('100');
  });

  it('returns 400 when limit is zero', async () => {
    const testUser = await createUserWithDefaults('transaction-get-limit-zero@example.com');

    const res = await request(app).get(`/users/${testUser.id}/transactions?limit=0`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when limit is negative', async () => {
    const testUser = await createUserWithDefaults('transaction-get-limit-neg@example.com');

    const res = await request(app).get(`/users/${testUser.id}/transactions?limit=-5`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when from is not a valid date', async () => {
    const testUser = await createUserWithDefaults('transaction-get-from-invalid@example.com');

    const res = await request(app).get(`/users/${testUser.id}/transactions?from=notadate`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
