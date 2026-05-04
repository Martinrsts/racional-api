import { stockRepository } from '../db/repositories/stock.repository.js';

export const stockPriceProvider = {
  async getPrices(isns: string[]): Promise<Record<string, number>> {
    const pricesFromRepository = await stockRepository.getPrices(isns);
    const prices: Record<string, number> = {};
    return isns.reduce((acc, isin) => {
      const price = pricesFromRepository.find((stock) => stock.isin === isin)?.currentPrice;
      acc[isin] = price ? parseFloat(price) : 0;
      return acc;
    }, prices);
  },
};
