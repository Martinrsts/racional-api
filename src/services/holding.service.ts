import { holdingRepository, HoldingWithPrice } from '../db/repositories/holding.repository.js';
import { portfolioRepository } from '../db/repositories/portfolio.repository.js';

export type HoldingTotal = HoldingWithPrice & { holdingValue: number };

export type PortfolioTotal = {
  holdings: HoldingTotal[];
  totalValue: number;
};

export const holdingService = {
  async getUserPortfolioTotal(userId: string): Promise<PortfolioTotal | null> {
    const portfolio = await portfolioRepository.findByUserId(userId);
    if (!portfolio) return null;

    await holdingRepository.updatePortfolioHoldings(portfolio.id);
    await holdingRepository.createMissingHoldingsFromOrders(portfolio.id);

    const holdings = await holdingRepository.findByPortfolioIdWithStock(portfolio.id);
    const updatedHoldings = holdings.map((holding) => ({
      ...holding,
      holdingValue: holding.quantity * parseFloat(holding.currentPrice),
    }));

    const totalValue = updatedHoldings.reduce((sum, holding) => sum + holding.holdingValue, 0);

    return { holdings: updatedHoldings, totalValue };
  },
};
