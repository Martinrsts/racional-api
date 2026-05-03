import { accountRepository } from '../db/repositories/account.repository.js';
import {
  transactionRepository,
  TransactionRecord,
} from '../db/repositories/transaction.repository.js';

export const transactionService = {
  async createTransactionFromUser(
    userId: string,
    data: {
      amount: number;
      executedAt: Date;
    }
  ): Promise<TransactionRecord | null> {
    const account = await accountRepository.findByUserId(userId);
    if (!account) return null;
    return transactionRepository.create({
      id: crypto.randomUUID(),
      accountId: account.id,
      amount: String(data.amount),
      executedAt: data.executedAt,
      createdAt: new Date(),
    });
  },

  async getUserTransactions(
    userId: string,
    filters?: { startDate?: Date; limit?: number }
  ): Promise<TransactionRecord[] | null> {
    const account = await accountRepository.findByUserId(userId);
    if (!account) return null;
    return transactionRepository.findByAccountId(account.id, filters);
  },
};
