import 'dotenv/config';
import { seed } from 'drizzle-seed';
import { db } from '../client.js';
import { account, order, portfolio, stock, transaction, user } from '../schema.js';
import { STOCKS } from './stockSeed.js';

// epoch ensures all seeded operations' createdAt (now) satisfy gt(createdAt, updatedAt)
const SEED_UPDATED_AT = new Date(0);

async function main() {
  const [existing] = await db.select().from(user).limit(1);
  if (existing) {
    console.log('Database already seeded, skipping.');
    process.exit(0);
  }

  await seed(db, { user }, { seed: 42 }).refine(() => ({
    user: { count: 3 },
  }));

  const users = await db.select({ id: user.id }).from(user);

  await db.insert(stock).values(
    STOCKS.reduce(
      (acc, s) => {
        if (!s.isin || !s.currentPrice) {
          return acc;
        }
        if (Number.isNaN(parseFloat(s.currentPrice))) return acc;
        return [...acc, { isin: s.isin, currentPrice: s.currentPrice }];
      },
      [] as { isin: string; currentPrice: string }[]
    )
  );

  const portfolios = users.map((u) => ({
    id: crypto.randomUUID(),
    userId: u.id,
    name: 'Default',
  }));
  await db.insert(portfolio).values(portfolios);

  const accounts = users.map((u) => ({
    id: crypto.randomUUID(),
    userId: u.id,
    name: 'Default',
    balance: '0',
    updatedAt: SEED_UPDATED_AT,
  }));
  await db.insert(account).values(accounts);

  const now = new Date();
  const stockIsins = STOCKS.map((s) => s.isin);

  const orders = portfolios.flatMap((p) =>
    stockIsins.slice(0, 4).map((isin, i) => ({
      id: crypto.randomUUID(),
      portfolioId: p.id,
      stockIsin: isin,
      quantity: (i + 1) * 10,
      placedAt: new Date('2024-06-01'),
      createdAt: now,
    }))
  );
  await db.insert(order).values(orders);

  const transactionValues = accounts.flatMap((a) => [
    {
      id: crypto.randomUUID(),
      accountId: a.id,
      amount: '10000.00',
      executedAt: new Date('2024-01-01'),
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      accountId: a.id,
      amount: '5000.00',
      executedAt: new Date('2024-06-01'),
      createdAt: now,
    },
  ]);
  await db.insert(transaction).values(transactionValues);

  console.log('Database seeded successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
