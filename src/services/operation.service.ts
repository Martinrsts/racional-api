import { transactionService } from './transaction.service.js';
import { orderService } from './order.service.js';
import { TransactionRecord } from '../db/repositories/transaction.repository.js';
import { OrderRecord } from '../db/repositories/order.repository.js';

type TransactionOperation = TransactionRecord & { type: 'transaction'; date: Date };
type OrderOperation = OrderRecord & { type: 'order'; date: Date };
export type Operation = TransactionOperation | OrderOperation;

export const operationService = {
  async getUserOperations(
    userId: string,
    filters?: { limit?: number; from?: Date }
  ): Promise<Operation[] | null> {
    const [transactions, orders] = await Promise.all([
      transactionService.getUserTransactions(userId, filters),
      orderService.getUserOrders(userId, filters),
    ]);

    if (transactions === null && orders === null) return null;

    let ops: Operation[] = [
      ...(transactions ?? []).map((t) => ({
        ...t,
        type: 'transaction' as const,
        date: t.executedAt,
      })),
      ...(orders ?? []).map((o) => ({ ...o, type: 'order' as const, date: o.placedAt })),
    ];

    if (filters?.from) {
      const from = filters.from;
      ops = ops.filter((op) => op.date >= from);
    }

    ops.sort((a, b) => b.date.getTime() - a.date.getTime());

    if (filters?.limit !== undefined) {
      ops = ops.slice(0, filters.limit);
    }

    return ops;
  },
};
