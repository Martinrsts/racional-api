import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { portfolio } from '../db/schema.js';
import { createUserWithDefaults } from '../tests/helpers.js';

describe('GET /users/:userId/portfolios', () => {
  it('returns the portfolio for the user', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults('portfolio-get@example.com');

    const res = await request(app).get(`/users/${userId}/portfolios`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: portfolioId, userId, name: 'Default' });
  });

  it('returns 404 when user has no portfolio', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app).get(`/users/${userId}/portfolios`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('PATCH /users/:userId/portfolios', () => {
  it('updates the portfolio name', async () => {
    const { id: userId, portfolioId } = await createUserWithDefaults('portfolio-patch@example.com');

    const res = await request(app)
      .patch(`/users/${userId}/portfolios`)
      .send({ name: 'My Portfolio' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: portfolioId, userId, name: 'My Portfolio' });

    const [row] = await db.select().from(portfolio).where(eq(portfolio.id, portfolioId));
    expect(row.name).toBe('My Portfolio');
  });

  it('returns 400 when name is missing', async () => {
    const { id: userId } = await createUserWithDefaults('portfolio-patch-invalid@example.com');

    const res = await request(app).patch(`/users/${userId}/portfolios`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when name is empty string', async () => {
    const { id: userId } = await createUserWithDefaults('portfolio-patch-empty@example.com');

    const res = await request(app).patch(`/users/${userId}/portfolios`).send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 when user has no portfolio', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app)
      .patch(`/users/${userId}/portfolios`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
