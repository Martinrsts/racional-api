import express from 'express';
import cors from 'cors';
import { userRouter } from './routes/user.js';
import { portfolioRouter } from './routes/portfolio.js';
import { accountRouter } from './routes/account.js';
import { orderRouter } from './routes/order.js';
import { transactionRouter } from './routes/transaction.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', userRouter);
app.use('/users/:userId/portfolios', portfolioRouter);
app.use('/users/:userId/accounts', accountRouter);
app.use('/users/:userId/portfolios/orders', orderRouter);
app.use('/users/:userId/accounts/transactions', transactionRouter);