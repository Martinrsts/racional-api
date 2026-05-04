import { pgTable, uuid, integer, timestamp, varchar, numeric } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
});

export const portfolio = pgTable('portfolio', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const stock = pgTable('stock', {
  isin: varchar('isin', { length: 255 }).notNull().unique().primaryKey(),
  currentPrice: numeric('current_price').notNull(),
});

export const holding = pgTable('holding', {
  id: uuid('id').primaryKey(),
  portfolioId: uuid('portfolio_id')
    .references(() => portfolio.id, { onDelete: 'cascade' })
    .notNull(),
  stockIsin: varchar('stock_isin', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const account = pgTable('account', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  balance: numeric('balance').notNull().default('0'),
  updatedAt: timestamp('updated_at'),
});

export const order = pgTable('order', {
  id: uuid('id').primaryKey(),
  portfolioId: uuid('portfolio_id')
    .references(() => portfolio.id, { onDelete: 'cascade' })
    .notNull(),
  stockIsin: varchar('stock_isin', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  placedAt: timestamp('placed_at').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const transaction = pgTable('transaction', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id')
    .references(() => account.id, { onDelete: 'cascade' })
    .notNull(),
  amount: numeric('amount').notNull(),
  executedAt: timestamp('executed_at').notNull(),
  createdAt: timestamp('created_at').notNull(),
});
