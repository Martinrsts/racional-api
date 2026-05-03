import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { EmailAlreadyInUseError } from '../errors.js';
import { userService } from '../services/user.service.js';
import { accountService } from '../services/account.service.js';

const router = Router();
const updateUserSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Al menos un campo debe ser proporcionado',
  });

const createUserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
});

router.patch('/:userId', async (req: Request, res: Response) => {
  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const userId = req.params.userId;

  try {
    const updated = await userService.update(userId, result.data);
    res.json(updated);
  } catch (err) {
    if (err instanceof EmailAlreadyInUseError) {
      res.status(409).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post('/', async (req: Request, res: Response) => {
    const result = createUserSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }

    try {
        const created = await userService.create(result.data);
        res.status(201).json(created);
    } catch (err) {
        if (err instanceof EmailAlreadyInUseError) {
            res.status(409).json({ error: err.message });
            return;
        }
        throw err;
    }
});

router.get('/:userId', async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const [user, account] = await Promise.all([
        userService.getById(userId),
        accountService.getByUserId(userId),
    ]);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json({ ...user, balance: account?.balance ?? null });
});

export { router as userRouter };
