import express from 'express';
import cors from 'cors';
import { userRouter } from './routes/user.js';
import { portfolioRouter } from './routes/portfolio.js';
import { orderRouter } from './routes/order.js';
import { transactionRouter } from './routes/transaction.js';
import { operationRouter } from './routes/operation.js';
import { db } from './db/client.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  db.execute('SELECT 1').then(() => {
    res.json({ status: 'ok' });
  });
});

app.use('/users', userRouter);
app.use('/users/:userId/portfolio', portfolioRouter);
app.use('/users/:userId/portfolio/orders', orderRouter);
app.use('/users/:userId/transactions', transactionRouter);
app.use('/users/:userId/operations', operationRouter);
