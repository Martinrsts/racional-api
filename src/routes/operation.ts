import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { operationService } from '../services/operation.service.js';

const router = Router({ mergeParams: true });

const querySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  from: z.coerce.date().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const operations = await operationService.getUserOperations(req.params.userId, result.data);
  if (operations === null) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(operations);
});

export { router as operationRouter };
