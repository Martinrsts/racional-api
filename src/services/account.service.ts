import { accountRepository, AccountRecord } from '../db/repositories/account.repository.js';

export const accountService = {
  async create(data: { userId: string; name: string }): Promise<AccountRecord> {
    return accountRepository.create({
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name,
      balance: '0',
      updatedAt: new Date(),
    });
  },

  async getUserAccount(userId: string): Promise<AccountRecord | null> {
    const account = await accountRepository.findByUserId(userId);
    if (!account) {
      return null;
    }
    return account;
  },

  async getByUserId(userId: string): Promise<AccountRecord | null> {
    return accountRepository.findByUserId(userId);
  },

  async updateUserAccount(userId: string, data: { name?: string }): Promise<AccountRecord | null> {
    const account = await accountRepository.findByUserId(userId);
    if (!account) {
      return null;
    }
    return accountRepository.update(account.id, data);
  },
};
