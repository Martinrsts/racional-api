import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { transactionService } from '../services/transaction.service.js';

const router = Router({ mergeParams: true });

const createTransactionSchema = z.object({
  amount: z.number(),
  executedAt: z.coerce.date(),
});

router.post('/', async (req: Request, res: Response) => {
  const result = createTransactionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const { userId } = req.params;

  const transaction = await transactionService.createTransactionFromUser(userId, result.data);
  if (!transaction) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }
  res.status(201).json(transaction);
});

router.get('/', async (req: Request, res: Response) => {
  const transactions = await transactionService.getUserTransactions(req.params.userId);
  if (!transactions) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }
  res.json(transactions);
});

export { router as transactionRouter };
