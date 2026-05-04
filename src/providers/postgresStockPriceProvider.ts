import { stockRepository } from '../db/repositories/stockRepository.js';
import { StockPriceProvider } from './stockPriceProvider.js';

const PostgresStockPriceProvider: StockPriceProvider = {
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

export default PostgresStockPriceProvider;
