import { and, desc, eq, gte } from 'drizzle-orm';
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

  async findByAccountId(
    accountId: string,
    filters: { startDate?: Date; limit?: number } = {}
  ): Promise<TransactionRecord[]> {
    const { startDate, limit } = filters;

    const conditions = [eq(transaction.accountId, accountId)];

    if (startDate) {
      conditions.push(gte(transaction.executedAt, startDate));
    }

    return limit
      ? db
          .select()
          .from(transaction)
          .where(and(...conditions))
          .orderBy(desc(transaction.executedAt))
          .limit(limit)
      : db
          .select()
          .from(transaction)
          .where(and(...conditions))
          .orderBy(desc(transaction.executedAt));
  },
};
