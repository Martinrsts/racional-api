import { db } from '../db/client.js';
import { user, portfolio, account } from '../db/schema.js';

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
