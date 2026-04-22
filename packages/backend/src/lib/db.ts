import { createClient, type Client } from '@libsql/client/web';
import type { Env } from '../types';
import { runMigrations } from './migrations';

let client: Client | null = null;

export function getDB(env: Env): Client {
  if (!client) {
    client = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initDB(env: Env) {
  const db = getDB(env);
  await runMigrations(db);
}
