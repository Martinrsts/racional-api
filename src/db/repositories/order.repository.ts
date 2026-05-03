import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '../client.js';
import { order } from '../schema.js';

export type OrderRecord = {
  id: string;
  portfolioId: string;
  stockIsin: string;
  quantity: number;
  placedAt: Date;
  createdAt: Date;
};

export type NewHoldingFromOrdersWithStock = {
  portfolioId: string;
  stockIsin: string;
  quantity: number;
  currentPrice: string;
};

export const orderRepository = {
  async create(data: OrderRecord): Promise<OrderRecord> {
    const [created] = await db.insert(order).values(data).returning();
    if (!created) throw new Error('Failed to create order');
    return created as OrderRecord;
  },

  async findByPortfolioId(
    portfolioId: string,
    filters: { limit?: number; startDate?: Date } = {}
  ): Promise<OrderRecord[]> {
    const { limit, startDate } = filters;
    const conditions = [eq(order.portfolioId, portfolioId)];

    if (startDate) {
      conditions.push(gte(order.placedAt, startDate));
    }

    return limit
      ? db
          .select()
          .from(order)
          .where(and(...conditions))
          .orderBy(desc(order.placedAt))
          .limit(limit)
      : db
          .select()
          .from(order)
          .where(and(...conditions))
          .orderBy(desc(order.placedAt));
  },
};
