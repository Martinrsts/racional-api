import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { db } from '../client.js';
import { user } from '../schema.js';
import { UserRecord } from '../../services/user.service.js';

export type UpdateUserData = Partial<Omit<UserRecord, 'id'>>

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof postgres.PostgresError && err.code === '23505';
}

export const userRepository = {

  async create(data: UserRecord): Promise<UserRecord> {
    try {
      const [created] = await db.insert(user).values(data).returning();
      if (!created) throw new Error('Failed to create user');
      return created;
    } catch (err) {
      if (isUniqueConstraintError(err)) throw new Error('Email already in use');
      throw err;
    }
  },

  async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    try {
      const [updated] = await db.update(user).set(data).where(eq(user.id, id)).returning({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      if (!updated) throw new Error('Failed to update user');
      return updated;
    } catch (err) {
      if (isUniqueConstraintError(err)) throw new Error('Email already in use');
      throw err;
    }
  },

  async read(id: string): Promise<UserRecord | null> {
    const [found] = await db.select().from(user).where(eq(user.id, id));
    return found ?? null;
  }
};
