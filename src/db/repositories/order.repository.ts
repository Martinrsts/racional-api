import { eq } from 'drizzle-orm';
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

  async findByPortfolioId(portfolioId: string): Promise<OrderRecord[]> {
    return db.select().from(order).where(eq(order.portfolioId, portfolioId)) as Promise<
      OrderRecord[]
    >;
  },
};
