import { db } from '../db/client.js';
import { user } from '../db/schema.js';

beforeEach(async () => {
  await db.delete(user).execute();
});
