import { portfolioRepository } from '../db/repositories/portfolioRepository.js';

export type PortfolioRecord = {
  id: string;
  userId: string;
  name: string;
};

export const portfolioService = {
  async create(data: { userId: string; name: string }): Promise<PortfolioRecord> {
    return portfolioRepository.create({
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name,
    });
  },

  async getById(id: string): Promise<PortfolioRecord | null> {
    return portfolioRepository.read(id);
  },

  async getByUserId(userId: string): Promise<PortfolioRecord | null> {
    return portfolioRepository.findByUserId(userId);
  },

  async updateUserPortfolio(
    userId: string,
    data: { name: string }
  ): Promise<PortfolioRecord | null> {
    const portfolio = await portfolioRepository.findByUserId(userId);
    if (!portfolio) {
      return null;
    }
    return portfolioRepository.update(portfolio.id, data);
  },
};
