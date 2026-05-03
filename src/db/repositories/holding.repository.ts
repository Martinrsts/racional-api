import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { holding, order, stock } from '../schema.js';

export type HoldingRecord = {
  id: string;
  portfolioId: string;
  stockIsin: string;
  quantity: number;
  updatedAt: Date;
};

export type HoldingWithPrice = HoldingRecord & {
  currentPrice: string;
};

export const holdingRepository = {
  async findByPortfolioIdWithStock(portfolioId: string): Promise<HoldingWithPrice[]> {
    const results = await db
      .select({
        id: holding.id,
        portfolioId: holding.portfolioId,
        stockIsin: holding.stockIsin,
        quantity: holding.quantity,
        updatedAt: holding.updatedAt,
        currentPrice: stock.currentPrice,
      })
      .from(holding)
      .innerJoin(stock, eq(holding.stockIsin, stock.isin))
      .where(eq(holding.portfolioId, portfolioId));
    return results as HoldingWithPrice[];
  },

  async createMissingHoldingsFromOrders(portfolioId: string): Promise<void> {
    const subquery = db
      .select({
        id: sql<string>`gen_random_uuid()`.as('id'),
        portfolioId: order.portfolioId,
        stockIsin: order.stockIsin,
        quantity: sql<number>`sum(${order.quantity})`.as('quantity'),
        updatedAt: sql<Date>`now()`.as('updatedAt'),
      })
      .from(order)
      .leftJoin(
        holding,
        and(eq(order.stockIsin, holding.stockIsin), eq(order.portfolioId, holding.portfolioId))
      )
      .where(and(eq(order.portfolioId, portfolioId), isNull(holding.id)))
      .groupBy(order.portfolioId, order.stockIsin)
      .as('subquery');

    await db.insert(holding).select(
      db
        .select({
          id: subquery.id,
          portfolioId: subquery.portfolioId,
          stockIsin: subquery.stockIsin,
          quantity: subquery.quantity,
          updatedAt: subquery.updatedAt,
        })
        .from(subquery)
    );
  },

  async updatePortfolioHoldings(portfolioId: string): Promise<void> {
    const subquery = db
      .select({
        id: holding.id,
        newQuantity: sql<number>`${holding.quantity} + sum(${order.quantity})`.as('newQuantity'),
      })
      .from(holding)
      .innerJoin(
        order,
        and(eq(holding.portfolioId, order.portfolioId), eq(holding.stockIsin, order.stockIsin))
      )
      .where(and(eq(holding.portfolioId, portfolioId), gt(order.createdAt, holding.updatedAt)))
      .groupBy(holding.id, holding.stockIsin, holding.quantity)
      .as('subquery');

    await db
      .update(holding)
      .set({ quantity: sql`${subquery.newQuantity}` })
      .from(subquery)
      .where(eq(holding.id, subquery.id));
  },
};
