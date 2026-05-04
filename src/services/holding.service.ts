import { HoldingRecord, holdingRepository } from '../db/repositories/holding.repository.js';
import { portfolioRepository } from '../db/repositories/portfolio.repository.js';
import { stockPriceProvider } from './stockPriceProvider.js';

export type HoldingTotal = HoldingRecord & { holdingValue: number };

export type PortfolioTotal = {
  total: number;
};

const mapHoldingsWithTotalValue = async (holdings: HoldingRecord[]): Promise<HoldingTotal[]> => {
  const stocks = await stockPriceProvider.getPrices(holdings.map((holding) => holding.stockIsin));
  return holdings.map((holding) => ({
    ...holding,
    holdingValue: (stocks[holding.stockIsin] || 0) * holding.quantity,
  }));
};

export const holdingService = {
  async getUserPortfolioTotal(userId: string): Promise<PortfolioTotal | null> {
    const portfolio = await portfolioRepository.findByUserId(userId);
    if (!portfolio) return null;

    await holdingRepository.updatePortfolioHoldings(portfolio.id);
    await holdingRepository.createMissingHoldingsFromOrders(portfolio.id);

    const holdings = await holdingRepository.findByPortfolioId(portfolio.id);
    const updatedHoldings = await mapHoldingsWithTotalValue(holdings);
    const total = updatedHoldings.reduce((sum, holding) => sum + holding.holdingValue, 0);

    return { total };
  },

  async getByPortfolioId(portfolioId: string) {
    await holdingRepository.updatePortfolioHoldings(portfolioId);
    await holdingRepository.createMissingHoldingsFromOrders(portfolioId);
    const holdings = await holdingRepository.findByPortfolioId(portfolioId);
    return await mapHoldingsWithTotalValue(holdings);
  },
};
