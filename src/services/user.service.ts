import { userRepository } from '../db/repositories/user.repository.js';
import { EmailAlreadyInUseError } from '../errors.js';
import { portfolioService } from './portfolio.service.js';
import { accountService } from './account.service.js';

export type UserRecord = {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
}


export const userService = {
  async create(data: {
    firstName?: string;
    lastName?: string;
    email: string;
  }): Promise<UserRecord> {
    try {
      const created = await userRepository.create({
        id: crypto.randomUUID(),
        email: data.email,
        firstName: data.firstName ? data.firstName : null,
        lastName: data.lastName ? data.lastName : null,
      });

      if (!created) throw new Error('Failed to create user');

      await Promise.all([
        portfolioService.create({ userId: created.id, name: 'Default' }),
        accountService.create({ userId: created.id, name: 'Default' }),
      ]);

      return created;
    } catch (err) {
      if (err instanceof Error && err.message === 'Email already in use') {
        throw new EmailAlreadyInUseError();
      }
      throw err;
    }
  },

  async update(
    userId: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
    }>
  ): Promise<UserRecord> {
    try {
      return await userRepository.update(userId, data);
    } catch (err) {
      if (err instanceof Error && err.message === 'Email already in use') {
        throw new EmailAlreadyInUseError();
      }
      throw err;
    }
  },

  async getById(userId: string): Promise<UserRecord | null> {
    return await userRepository.read(userId);
  }
};
