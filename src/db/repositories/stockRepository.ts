import { inArray } from 'drizzle-orm';
import { db } from '../client.js';
import { stock } from '../schema.js';

export type StockRecord = {
  isin: string;
  currentPrice: string;
};

export const stockRepository = {
  async getPrices(isns: string[]): Promise<StockRecord[]> {
    const stocks = await db.select().from(stock).where(inArray(stock.isin, isns));
    if (!stocks) throw new Error('Failed to fetch stock prices');
    return stocks;
  },
};
