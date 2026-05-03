import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { account } from '../db/schema.js';
import { createUserWithDefaults } from '../tests/helpers.js';

describe('GET /users/:userId/accounts', () => {
  it('returns the account for the user', async () => {
    const { id: userId, accountId } = await createUserWithDefaults('account-get@example.com');

    const res = await request(app).get(`/users/${userId}/accounts`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: accountId, userId, name: 'Default', balance: '0' });
  });

  it('returns 404 when user has no account', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app).get(`/users/${userId}/accounts`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('PATCH /users/:userId/accounts', () => {
  it('updates the account name', async () => {
    const { id: userId, accountId } = await createUserWithDefaults('account-patch@example.com');

    const res = await request(app)
      .patch(`/users/${userId}/accounts`)
      .send({ name: 'Savings' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: accountId, userId, name: 'Savings' });

    const [row] = await db.select().from(account).where(eq(account.id, accountId));
    expect(row.name).toBe('Savings');
  });

  it('returns 400 when name is missing', async () => {
    const { id: userId } = await createUserWithDefaults('account-patch-invalid@example.com');

    const res = await request(app).patch(`/users/${userId}/accounts`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when name is empty string', async () => {
    const { id: userId } = await createUserWithDefaults('account-patch-empty@example.com');

    const res = await request(app).patch(`/users/${userId}/accounts`).send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 when user has no account', async () => {
    const userId = crypto.randomUUID();

    const res = await request(app)
      .patch(`/users/${userId}/accounts`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
