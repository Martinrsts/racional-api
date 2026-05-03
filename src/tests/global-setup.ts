import { execSync } from 'child_process';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const TEST_DB_URL = 'postgresql://postgres:postgres@localhost:5433/racional';

export async function setup() {
  execSync('docker compose up postgres-test --wait', { stdio: 'inherit' });
  const client = postgres(TEST_DB_URL, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './drizzle' });
  await client.end({ timeout: 5 });
}

export async function teardown() {
  execSync('docker compose stop postgres-test', { stdio: 'inherit' });
}
