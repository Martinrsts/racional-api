import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { user } from '../db/schema.js';

async function createUser(email: string, firstName?: string, lastName?: string): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(user).values({ id, email, firstName: firstName ?? null, lastName: lastName ?? null });
  return id;
}

describe('POST /users', () => {
  it('creates a user with email only', async () => {
    const res = await request(app).post('/users').send({ email: 'new@example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'new@example.com', firstName: null, lastName: null });
    expect(typeof res.body.id).toBe('string');

    const [row] = await db.select().from(user).where(eq(user.email, 'new@example.com'));
    expect(row).toBeDefined();
  });

  it('creates a user with all fields', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'full@example.com', firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'full@example.com', firstName: 'John', lastName: 'Doe' });
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/users').send({ firstName: 'John' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app).post('/users').send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 409 when email is already in use', async () => {
    await createUser('taken@example.com');

    const res = await request(app).post('/users').send({ email: 'taken@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });
});

describe('PATCH /users/:userId', () => {
  it('updates user email', async () => {
    const id = await createUser('old@example.com');

    const res = await request(app).patch(`/users/${id}`).send({ email: 'updated@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, email: 'updated@example.com' });

    const [row] = await db.select().from(user).where(eq(user.id, id));
    expect(row.email).toBe('updated@example.com');
  });

  it('updates user firstName', async () => {
    const id = await createUser('user@example.com');

    const res = await request(app).patch(`/users/${id}`).send({ firstName: 'Jane' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, firstName: 'Jane' });
  });

  it('updates user lastName', async () => {
    const id = await createUser('user2@example.com');

    const res = await request(app).patch(`/users/${id}`).send({ lastName: 'Smith' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, lastName: 'Smith' });
  });

  it('returns 400 when body is empty', async () => {
    const id = crypto.randomUUID();

    const res = await request(app).patch(`/users/${id}`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when email is invalid', async () => {
    const id = crypto.randomUUID();

    const res = await request(app).patch(`/users/${id}`).send({ email: 'not-valid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when firstName is empty string', async () => {
    const id = crypto.randomUUID();

    const res = await request(app).patch(`/users/${id}`).send({ firstName: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 409 when email is already in use by another user', async () => {
    const id1 = await createUser('user1@example.com');
    await createUser('user2@example.com');

    const res = await request(app).patch(`/users/${id1}`).send({ email: 'user2@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /users/:userId', () => {
  it('returns the user when found', async () => {
    const id = await createUser('get@example.com', 'Get', 'User');

    const res = await request(app).get(`/users/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, email: 'get@example.com', firstName: 'Get', lastName: 'User' });
  });

  it('returns 404 when user does not exist', async () => {
    const id = crypto.randomUUID();

    const res = await request(app).get(`/users/${id}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
