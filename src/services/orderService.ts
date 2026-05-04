import { orderRepository, OrderRecord } from '../db/repositories/orderRepository.js';
import { portfolioRepository } from '../db/repositories/portfolioRepository.js';

export const orderService = {
  async createOrderFromUser(
    userId: string,
    data: {
      stockIsin: string;
      quantity: number;
      placedAt: Date;
    }
  ): Promise<OrderRecord | null> {
    const portfolio = await portfolioRepository.findByUserId(userId);
    if (!portfolio) return null;
    return orderRepository.create({
      id: crypto.randomUUID(),
      portfolioId: portfolio.id,
      stockIsin: data.stockIsin,
      quantity: data.quantity,
      placedAt: data.placedAt,
      createdAt: new Date(),
    });
  },

  async getUserOrders(
    userId: string,
    filters?: { limit?: number; startDate?: Date }
  ): Promise<OrderRecord[] | null> {
    const portfolio = await portfolioRepository.findByUserId(userId);
    if (!portfolio) return null;
    return orderRepository.findByPortfolioId(portfolio.id, filters);
  },
};
