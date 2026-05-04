import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/orderService.js';

const router = Router({ mergeParams: true });

const createOrderSchema = z.object({
  stockIsin: z.string().min(1),
  quantity: z.number().int(),
  placedAt: z.coerce.date(),
});

const querySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const order = await orderService.createOrderFromUser(req.params.userId, result.data);
  if (!order) {
    res.status(404).json({ error: 'Portfolio not found' });
    return;
  }
  res.status(201).json(order);
});

router.get('/', async (req: Request, res: Response) => {
  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const orders = await orderService.getUserOrders(req.params.userId, {
    limit: result.data.limit,
    startDate: result.data.from,
  });
  if (!orders) {
    res.status(404).json({ error: 'Portfolio not found' });
    return;
  }
  res.json(orders);
});

export { router as orderRouter };
