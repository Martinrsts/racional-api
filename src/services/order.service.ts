import { orderRepository, OrderRecord } from '../db/repositories/order.repository.js';
import { portfolioRepository } from '../db/repositories/portfolio.repository.js';

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

  async getUserOrders(userId: string): Promise<OrderRecord[] | null> {
    const portfolio = await portfolioRepository.findByUserId(userId);
    if (!portfolio) return null;
    return orderRepository.findByPortfolioId(portfolio.id);
  },
};
