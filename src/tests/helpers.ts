import { db } from '../db/client.js';
import { user, portfolio, account, stock } from '../db/schema.js';

export const TEST_STOCKS = [
  { isin: 'US0378331005', actualPrice: '189.50' },
  { isin: 'US5949181045', actualPrice: '415.20' },
  { isin: 'US88160R1014', actualPrice: '177.80' },
  { isin: 'US02079K3059', actualPrice: '173.40' },
  { isin: 'US0231351067', actualPrice: '182.60' },
];

export async function seedStocks(): Promise<typeof TEST_STOCKS> {
  await db.insert(stock).values(TEST_STOCKS).onConflictDoNothing();
  return TEST_STOCKS;
}

export type TestUser = {
  id: string;
  email: string;
  portfolioId: string;
  accountId: string;
};

export async function createUserWithDefaults(email: string): Promise<TestUser> {
  const userId = crypto.randomUUID();
  const portfolioId = crypto.randomUUID();
  const accountId = crypto.randomUUID();

  await db.insert(user).values({ id: userId, email, firstName: null, lastName: null });
  await db.insert(portfolio).values({ id: portfolioId, userId, name: 'Default' });
  await db.insert(account).values({
    id: accountId,
    userId,
    name: 'Default',
    balance: '0',
    updatedAt: new Date(),
  });

  return { id: userId, email, portfolioId, accountId };
}
