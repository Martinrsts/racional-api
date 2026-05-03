import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { portfolioService } from '../services/portfolio.service.js';
import { holdingService } from '../services/holding.service.js';

const router = Router({ mergeParams: true });

const updatePortfolioSchema = z.object({
  name: z.string().min(1),
});

router.get('/total', async (req: Request, res: Response) => {
  const total = await holdingService.getUserPortfolioTotal(req.params.userId);
  if (!total) {
    res.status(404).json({ error: 'Portfolio not found' });
    return;
  }
  res.json(total);
});

router.get('/', async (req: Request, res: Response) => {
  const portfolio = await portfolioService.getByUserId(req.params.userId);
  if (!portfolio) {
    res.status(404).json({ error: 'Portfolio not found' });
    return;
  }
  res.json(portfolio);
});

router.patch('/', async (req: Request, res: Response) => {
  const result = updatePortfolioSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const portfolio = await portfolioService.getByUserId(req.params.userId);
  if (!portfolio) {
    res.status(404).json({ error: 'Portfolio not found' });
    return;
  }

  const updated = await portfolioService.updateUserPortfolio(req.params.userId, result.data);
  res.json(updated);
});


export { router as portfolioRouter };
