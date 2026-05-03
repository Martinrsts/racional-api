import { eq } from 'drizzle-orm';
import { db } from '../client.js';
import { account } from '../schema.js';

export type AccountRecord = {
  id: string;
  userId: string;
  name: string;
  balance: string;
  updatedAt: Date;
};

export const accountRepository = {
  async create(data: AccountRecord): Promise<AccountRecord> {
    const [created] = await db.insert(account).values(data).returning();
    if (!created) throw new Error('Failed to create account');
    return created as AccountRecord;
  },

  async read(id: string): Promise<AccountRecord | null> {
    const [found] = await db.select().from(account).where(eq(account.id, id));
    return (found as AccountRecord) ?? null;
  },

  async update(id: string, data: Partial<Pick<AccountRecord, 'name' | 'balance'>>): Promise<AccountRecord> {
    const [updated] = await db
      .update(account)
      .set(data)
      .where(eq(account.id, id))
      .returning();
    if (!updated) throw new Error('Failed to update account');
    return updated as AccountRecord;
  },
  
  async findByUserId(userId: string): Promise<AccountRecord | null> {
    const results = await db.select().from(account).where(eq(account.userId, userId));
    if (!results || results.length === 0) {
      return null;
    }
    return results[0];
  },
};
