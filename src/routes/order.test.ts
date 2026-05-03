import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { order } from '../db/schema.js';
import { createUserWithDefaults, seedStocks, TEST_STOCKS } from '../tests/helpers.js';

describe('POST /users/:userId/portfolios/orders', () => {
  it('creates an order and returns 201', async () => {
    const testUser = await createUserWithDefaults('order-post@example.com');
    await seedStocks();

    const placedAt = new Date('2024-01-15T10:00:00.000Z');
    const res = await request(app)
      .post(`/users/${testUser.id}/portfolios/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 10,
        accountId: testUser.accountId,
        placedAt: placedAt.toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      portfolioId: testUser.portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
      accountId: testUser.accountId,
    });

    const [row] = await db.select().from(order).where(eq(order.id, res.body.id));
    expect(row).toBeDefined();
    expect(row.quantity).toBe(10);
  });

  it('returns 400 when stockIsin is missing', async () => {
    const testUser = await createUserWithDefaults('order-post-no-isin@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/portfolios/orders`)
      .send({ quantity: 10, accountId: testUser.accountId, placedAt: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when stockIsin is empty string', async () => {
    const testUser = await createUserWithDefaults('order-post-empty-isin@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/portfolios/orders`)
      .send({ stockIsin: '', quantity: 10, accountId: testUser.accountId, placedAt: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when quantity is not an integer', async () => {
    const testUser = await createUserWithDefaults('order-post-float-qty@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/portfolios/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 1.5,
        accountId: testUser.accountId,
        placedAt: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when accountId is not a UUID', async () => {
    const testUser = await createUserWithDefaults('order-post-bad-account@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/portfolios/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 10,
        accountId: 'not-a-uuid',
        placedAt: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when placedAt is missing', async () => {
    const testUser = await createUserWithDefaults('order-post-no-date@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/portfolios/orders`)
      .send({ stockIsin: TEST_STOCKS[0].isin, quantity: 10, accountId: testUser.accountId });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 when user has no portfolio', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app)
      .post(`/users/${userId}/portfolios/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 10,
        accountId: crypto.randomUUID(),
        placedAt: new Date().toISOString(),
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /users/:userId/portfolios/orders', () => {
  it('returns orders for the user', async () => {
    const testUser = await createUserWithDefaults('order-get@example.com');
    await seedStocks();

    await request(app)
      .post(`/users/${testUser.id}/portfolios/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 5,
        accountId: testUser.accountId,
        placedAt: new Date('2024-01-15T10:00:00.000Z').toISOString(),
      });

    const res = await request(app).get(`/users/${testUser.id}/portfolios/orders`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      portfolioId: testUser.portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 5,
    });
  });

  it('returns empty array when user has no orders', async () => {
    const testUser = await createUserWithDefaults('order-get-empty@example.com');

    const res = await request(app).get(`/users/${testUser.id}/portfolios/orders`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 404 when user has no portfolio', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app).get(`/users/${userId}/portfolios/orders`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
