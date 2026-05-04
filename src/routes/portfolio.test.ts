import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { holding, order, portfolio } from '../db/schema.js';
import { createUserWithDefaults, seedStocks, TEST_STOCKS } from '../tests/helpers.js';

describe('GET /users/:userId/portfolio', () => {
  it('returns the portfolio for the user', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults('portfolio-get@example.com');

    const res = await request(app).get(`/users/${userId}/portfolio`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: portfolioId, userId, name: 'Default' });
  });

  it('returns 404 when user has no portfolio', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app).get(`/users/${userId}/portfolio`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('PATCH /users/:userId/portfolio', () => {
  it('updates the portfolio name', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults('portfolio-patch@example.com');

    const res = await request(app)
      .patch(`/users/${userId}/portfolio`)
      .send({ name: 'My Portfolio' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: portfolioId, userId, name: 'My Portfolio' });

    const [row] = await db.select().from(portfolio).where(eq(portfolio.id, portfolioId));
    expect(row.name).toBe('My Portfolio');
  });

  it('returns 400 when name is missing', async () => {
    const { id: userId } = await createUserWithDefaults('portfolio-patch-invalid@example.com');

    const res = await request(app).patch(`/users/${userId}/portfolio`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when name is empty string', async () => {
    const { id: userId } = await createUserWithDefaults('portfolio-patch-empty@example.com');

    const res = await request(app).patch(`/users/${userId}/portfolio`).send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 when user has no portfolio', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app).patch(`/users/${userId}/portfolio`).send({ name: 'New Name' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /users/:userId/portfolio/total', () => {
  it('returns 404 when user has no portfolio', async () => {
    const res = await request(app).get(`/users/${crypto.randomUUID()}/portfolio/total`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('returns empty holdings and zero total when portfolio has no activity', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults('total-empty@example.com');

    const res = await request(app).get(`/users/${userId}/portfolio/total`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 0 });
    const dbHoldings = await db.select().from(holding).where(eq(holding.portfolioId, portfolioId));
    expect(dbHoldings).toHaveLength(0);
  });

  it('returns correct value when no new orders exist', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults(
      'total-no-new-orders@example.com'
    );
    await seedStocks();

    await db.insert(holding).values({
      id: crypto.randomUUID(),
      portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    const res = await request(app).get(`/users/${userId}/portfolio/total`);

    expect(res.status).toBe(200);
    const expectedValue = 10 * parseFloat(TEST_STOCKS[0].currentPrice);
    expect(res.body.total).toBeCloseTo(expectedValue);
  });

  it('updates holding quantity and persists to DB when new orders exist after updatedAt', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults(
      'total-update-holding@example.com'
    );
    await seedStocks();

    const holdingId = crypto.randomUUID();
    await db.insert(holding).values({
      id: holdingId,
      portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    await db.insert(order).values({
      id: crypto.randomUUID(),
      portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 5,
      placedAt: new Date('2024-01-15T10:00:00.000Z'),
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
    });

    const res = await request(app).get(`/users/${userId}/portfolio/total`);

    expect(res.status).toBe(200);
    const expectedValue = 15 * parseFloat(TEST_STOCKS[0].currentPrice);
    expect(res.body.total).toBeCloseTo(expectedValue);

    const [dbRow] = await db.select().from(holding).where(eq(holding.id, holdingId));
    expect(dbRow.quantity).toBe(15);
  });

  it('does not update holding for orders created before updatedAt', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults(
      'total-old-orders@example.com'
    );
    await seedStocks();

    const holdingId = crypto.randomUUID();
    await db.insert(holding).values({
      id: holdingId,
      portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
      updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    });
    await db.insert(order).values({
      id: crypto.randomUUID(),
      portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 5,
      placedAt: new Date('2024-01-15T10:00:00.000Z'),
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
    });

    const res = await request(app).get(`/users/${userId}/portfolio/total`);

    expect(res.status).toBe(200);

    const [dbRow] = await db.select().from(holding).where(eq(holding.id, holdingId));
    expect(dbRow.quantity).toBe(10);
  });

  it('creates a new holding from orders when no holding exists for that stock', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults(
      'total-new-holding@example.com'
    );
    await seedStocks();

    await db.insert(order).values({
      id: crypto.randomUUID(),
      portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
      placedAt: new Date('2024-01-15T10:00:00.000Z'),
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
    });

    const res = await request(app).get(`/users/${userId}/portfolio/total`);

    expect(res.status).toBe(200);
    const expectedValue = 10 * parseFloat(TEST_STOCKS[0].currentPrice);
    expect(res.body.total).toBeCloseTo(expectedValue);

    const dbHoldings = await db.select().from(holding).where(eq(holding.portfolioId, portfolioId));
    expect(dbHoldings).toHaveLength(1);
    expect(dbHoldings[0]).toMatchObject({
      portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
    });
  });

  it('sums multiple orders for the same stock when creating a new holding', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults(
      'total-multi-orders@example.com'
    );
    await seedStocks();

    await db.insert(order).values([
      {
        id: crypto.randomUUID(),
        portfolioId,
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 10,
        placedAt: new Date('2024-01-15T10:00:00.000Z'),
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      },
      {
        id: crypto.randomUUID(),
        portfolioId,
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 5,
        placedAt: new Date('2024-01-16T10:00:00.000Z'),
        createdAt: new Date('2024-01-16T10:00:00.000Z'),
      },
    ]);

    const res = await request(app).get(`/users/${userId}/portfolio/total`);

    expect(res.status).toBe(200);

    const dbHoldings = await db.select().from(holding).where(eq(holding.portfolioId, portfolioId));
    expect(dbHoldings).toHaveLength(1);
    expect(dbHoldings[0].quantity).toBe(15);
  });

  it('updates an existing holding and creates a new one simultaneously', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults('total-mixed@example.com');
    await seedStocks();

    const holdingId = crypto.randomUUID();
    await db.insert(holding).values({
      id: holdingId,
      portfolioId,
      stockIsin: TEST_STOCKS[0].isin,
      quantity: 10,
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    await db.insert(order).values([
      {
        id: crypto.randomUUID(),
        portfolioId,
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 5,
        placedAt: new Date('2024-01-15T10:00:00.000Z'),
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      },
      {
        id: crypto.randomUUID(),
        portfolioId,
        stockIsin: TEST_STOCKS[1].isin,
        quantity: 8,
        placedAt: new Date('2024-01-15T10:00:00.000Z'),
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      },
    ]);

    const res = await request(app).get(`/users/${userId}/portfolio/total`);

    expect(res.status).toBe(200);

    const dbHoldings = await db.select().from(holding).where(eq(holding.portfolioId, portfolioId));
    expect(dbHoldings).toHaveLength(2);

    const h0 = dbHoldings.find((h) => h.stockIsin === TEST_STOCKS[0].isin);
    const h1 = dbHoldings.find((h) => h.stockIsin === TEST_STOCKS[1].isin);
    expect(h0!.quantity).toBe(15);
    expect(h1!.quantity).toBe(8);

    const expectedTotal =
      15 * parseFloat(TEST_STOCKS[0].currentPrice) + 8 * parseFloat(TEST_STOCKS[1].currentPrice);
    expect(res.body.total).toBeCloseTo(expectedTotal);
  });

  it('computes correct total across multiple existing holdings', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults(
      'total-multi-holdings@example.com'
    );
    await seedStocks();

    await db.insert(holding).values([
      {
        id: crypto.randomUUID(),
        portfolioId,
        stockIsin: TEST_STOCKS[0].isin,
        quantity: 10,
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: crypto.randomUUID(),
        portfolioId,
        stockIsin: TEST_STOCKS[1].isin,
        quantity: 5,
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);

    const res = await request(app).get(`/users/${userId}/portfolio/total`);

    expect(res.status).toBe(200);

    const dbHoldings = await db.select().from(holding).where(eq(holding.portfolioId, portfolioId));
    expect(dbHoldings).toHaveLength(2);

    const expectedTotal =
      10 * parseFloat(TEST_STOCKS[0].currentPrice) + 5 * parseFloat(TEST_STOCKS[1].currentPrice);
    expect(res.body.total).toBeCloseTo(expectedTotal);
  });
});
