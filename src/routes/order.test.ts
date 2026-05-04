import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { order } from '../db/schema.js';
import { createUserWithDefaults, seedStocks, TEST_STOCKS } from '../tests/helpers.js';

describe('POST /users/:userId/portfolio/orders', () => {
  it('creates an order and returns 201', async () => {
    const testUser = await createUserWithDefaults('order-post@example.com');
    await seedStocks();

    const placedAt = new Date('2024-01-15T10:00:00.000Z');
    const res = await request(app).post(`/users/${testUser.id}/portfolio/orders`).send({
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
      placedAt: placedAt.toISOString(),
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      portfolioId: testUser.portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
    });

    const [row] = await db.select().from(order).where(eq(order.id, res.body.id));
    expect(row).toBeDefined();
    expect(row.quantity).toBe(10);
  });

  it('returns 400 when stockIsin is missing', async () => {
    const testUser = await createUserWithDefaults('order-post-no-isin@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/portfolio/orders`)
      .send({ quantity: 10, placedAt: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when stockIsin is empty string', async () => {
    const testUser = await createUserWithDefaults('order-post-empty-isin@example.com');

    const res = await request(app).post(`/users/${testUser.id}/portfolio/orders`).send({
      stockIsin: '',
      quantity: 10,
      placedAt: new Date().toISOString(),
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when quantity is not an integer', async () => {
    const testUser = await createUserWithDefaults('order-post-float-qty@example.com');

    const res = await request(app).post(`/users/${testUser.id}/portfolio/orders`).send({
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 1.5,
      placedAt: new Date().toISOString(),
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when placedAt is missing', async () => {
    const testUser = await createUserWithDefaults('order-post-no-date@example.com');

    const res = await request(app)
      .post(`/users/${testUser.id}/portfolio/orders`)
      .send({ stockIsin: TEST_STOCKS[0].isin, quantity: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 when user has no portfolio', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app).post(`/users/${userId}/portfolio/orders`).send({
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
      placedAt: new Date().toISOString(),
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /users/:userId/portfolio/orders', () => {
  it('returns orders for the user', async () => {
    const testUser = await createUserWithDefaults('order-get@example.com');
    await seedStocks();

    await request(app)
      .post(`/users/${testUser.id}/portfolio/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 5,
        placedAt: new Date('2024-01-15T10:00:00.000Z').toISOString(),
      });

    const res = await request(app).get(`/users/${testUser.id}/portfolio/orders`);

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

    const res = await request(app).get(`/users/${testUser.id}/portfolio/orders`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 404 when user has no portfolio', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app).get(`/users/${userId}/portfolio/orders`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('limits results when limit query param is provided', async () => {
    const testUser = await createUserWithDefaults('order-get-limit@example.com');
    await seedStocks();

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/users/${testUser.id}/portfolio/orders`)
        .send({
          stockIsin: TEST_STOCKS[0].isin,
          quantity: i + 1,
          placedAt: new Date(
            `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`
          ).toISOString(),
        });
    }

    const res = await request(app).get(`/users/${testUser.id}/portfolio/orders?limit=2`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters orders by from date', async () => {
    const testUser = await createUserWithDefaults('order-get-from@example.com');
    await seedStocks();

    await request(app)
      .post(`/users/${testUser.id}/portfolio/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 1,
        placedAt: new Date('2024-01-01T10:00:00.000Z').toISOString(),
      });
    await request(app)
      .post(`/users/${testUser.id}/portfolio/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 2,
        placedAt: new Date('2024-06-01T10:00:00.000Z').toISOString(),
      });
    await request(app)
      .post(`/users/${testUser.id}/portfolio/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 3,
        placedAt: new Date('2024-12-01T10:00:00.000Z').toISOString(),
      });

    const res = await request(app).get(`/users/${testUser.id}/portfolio/orders?from=2024-06-01`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((o: { quantity: number }) => o.quantity >= 2)).toBe(true);
  });

  it('returns results ordered by placedAt descending', async () => {
    const testUser = await createUserWithDefaults('order-get-order@example.com');
    await seedStocks();

    await request(app)
      .post(`/users/${testUser.id}/portfolio/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 1,
        placedAt: new Date('2024-01-01T10:00:00.000Z').toISOString(),
      });
    await request(app)
      .post(`/users/${testUser.id}/portfolio/orders`)
      .send({
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 2,
        placedAt: new Date('2024-03-01T10:00:00.000Z').toISOString(),
      });

    const res = await request(app).get(`/users/${testUser.id}/portfolio/orders`);

    expect(res.status).toBe(200);
    expect(res.body[0].quantity).toBe(2);
    expect(res.body[1].quantity).toBe(1);
  });

  it('returns 400 when limit is zero', async () => {
    const testUser = await createUserWithDefaults('order-get-limit-zero@example.com');

    const res = await request(app).get(`/users/${testUser.id}/portfolio/orders?limit=0`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when limit is negative', async () => {
    const testUser = await createUserWithDefaults('order-get-limit-neg@example.com');

    const res = await request(app).get(`/users/${testUser.id}/portfolio/orders?limit=-1`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when from is not a valid date', async () => {
    const testUser = await createUserWithDefaults('order-get-from-invalid@example.com');

    const res = await request(app).get(`/users/${testUser.id}/portfolio/orders?from=notadate`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
