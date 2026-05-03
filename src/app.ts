import express from 'express';
import cors from 'cors';
import { userRouter } from './routes/user.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', userRouter);