import { eq } from 'drizzle-orm';
import { db } from '../client.js';
import { portfolio } from '../schema.js';
import { PortfolioRecord } from '../../services/portfolio.service.js';


export const portfolioRepository = {
  async create(data: PortfolioRecord): Promise<PortfolioRecord> {
    const [created] = await db.insert(portfolio).values(data).returning();
    if (!created) throw new Error('Failed to create portfolio');
    return created as PortfolioRecord;
  },

  async read(id: string): Promise<PortfolioRecord | null> {
    const [found] = await db.select().from(portfolio).where(eq(portfolio.id, id));
    return (found as PortfolioRecord) ?? null;
  },

  async update(id: string, data: Partial<Pick<PortfolioRecord, 'name'>>): Promise<PortfolioRecord> {
    const [updated] = await db.update(portfolio).set(data).where(eq(portfolio.id, id)).returning();
    if (!updated) throw new Error('Failed to update portfolio');
    return updated as PortfolioRecord;
  },

  async findByUserId(userId: string): Promise<PortfolioRecord | null> {
    const results = await db.select().from(portfolio).where(eq(portfolio.userId, userId));
    if (!results || results.length === 0) {
      return null;
    }
    return results[0];
  },
};
