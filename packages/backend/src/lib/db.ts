import { createClient, type Client } from '@libsql/client/web';
import type { Env } from '../types';

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

  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      picture TEXT,
      plan TEXT DEFAULT 'free' CHECK(plan IN ('free','plus','family')),
      daily_tts_count INTEGER DEFAULT 0,
      daily_tts_reset_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS voice_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      perso_voice_id TEXT,
      elevenlabs_voice_id TEXT,
      avatar_url TEXT,
      status TEXT DEFAULT 'processing' CHECK(status IN ('processing','ready','failed')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      voice_profile_id TEXT NOT NULL REFERENCES voice_profiles(id),
      text TEXT NOT NULL,
      audio_url TEXT,
      category TEXT DEFAULT 'custom',
      is_preset INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS alarms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      target_user_id TEXT,
      message_id TEXT NOT NULL REFERENCES messages(id),
      time TEXT NOT NULL,
      repeat_days TEXT DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      snooze_minutes INTEGER DEFAULT 5,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS message_library (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      message_id TEXT NOT NULL REFERENCES messages(id),
      is_favorite INTEGER DEFAULT 0,
      received_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user_a TEXT NOT NULL,
      user_b TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','blocked')),
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS gifts (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      message_id TEXT NOT NULL REFERENCES messages(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
      note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
  ]);
}
