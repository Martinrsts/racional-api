import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { accountService } from '../services/account.service.js';

const router = Router({ mergeParams: true });

const updateAccountSchema = z
  .object({
    name: z.string().min(1),
  })

router.get('/', async (req: Request, res: Response) => {
  const account = await accountService.getUserAccount(req.params.userId);
  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }
  res.json(account);
});

router.patch('/', async (req: Request, res: Response) => {
  const result = updateAccountSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const account = await accountService.updateUserAccount(req.params.userId,  result.data);
  if (!account) {
    res.status(404).json({ error: 'Account not found' });
    return;
  }

  res.json(account);
});

export { router as accountRouter };
