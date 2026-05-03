import { eq } from 'drizzle-orm';
import { db } from '../client.js';
import { transaction } from '../schema.js';

export type TransactionRecord = {
  id: string;
  accountId: string;
  amount: string;
  executedAt: Date;
  createdAt: Date;
};

export const transactionRepository = {
  async create(data: TransactionRecord): Promise<TransactionRecord> {
    const [created] = await db.insert(transaction).values(data).returning();
    if (!created) throw new Error('Failed to create transaction');
    return created as TransactionRecord;
  },

  async findByAccountId(accountId: string): Promise<TransactionRecord[]> {
    return db.select().from(transaction).where(eq(transaction.accountId, accountId)) as Promise<TransactionRecord[]>;
  },
};
