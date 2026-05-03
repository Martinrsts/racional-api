import { execSync } from 'child_process';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const TEST_DB_URL = 'postgresql://postgres:postgres@localhost:5433/racional';

async function waitForDb(url: string, retries = 20, delayMs = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = postgres(url, { max: 1, connect_timeout: 2 });
      await client`SELECT 1`;
      await client.end();
      return;
    } catch {
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  throw new Error('Test database did not become ready in time');
}

export async function setup() {
  execSync('docker compose --profile test -p racional-test up -d postgres-test', { stdio: 'inherit' });
  await waitForDb(TEST_DB_URL);
  const client = postgres(TEST_DB_URL, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './drizzle' });
  await client.end({ timeout: 5 });
}

export async function teardown() {
  execSync('docker compose --profile test -p racional-test down', { stdio: 'inherit' });
}
