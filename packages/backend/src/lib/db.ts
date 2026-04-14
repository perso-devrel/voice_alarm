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

  await db.batch([
    'CREATE INDEX IF NOT EXISTS idx_voice_profiles_user ON voice_profiles(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_voice ON messages(voice_profile_id)',
    'CREATE INDEX IF NOT EXISTS idx_alarms_user ON alarms(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_alarms_target ON alarms(target_user_id)',
    'CREATE INDEX IF NOT EXISTS idx_alarms_message ON alarms(message_id)',
    'CREATE INDEX IF NOT EXISTS idx_alarms_active ON alarms(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_library_user ON message_library(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_library_message ON message_library(message_id)',
    'CREATE INDEX IF NOT EXISTS idx_friendships_user_a ON friendships(user_a)',
    'CREATE INDEX IF NOT EXISTS idx_friendships_user_b ON friendships(user_b)',
    'CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status)',
    'CREATE INDEX IF NOT EXISTS idx_gifts_sender ON gifts(sender_id)',
    'CREATE INDEX IF NOT EXISTS idx_gifts_recipient ON gifts(recipient_id)',
    'CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  ]);

  // 마이그레이션: google_id 컬럼 추가 (이미 있으면 무시)
  try {
    await db.execute('ALTER TABLE users ADD COLUMN google_id TEXT');
    // 기존 유저의 google_id를 id로 초기화
    await db.execute('UPDATE users SET google_id = id WHERE google_id IS NULL');
  } catch {
    // 이미 컬럼이 존재하면 무시
  }

  // google_id UNIQUE 인덱스 (없으면 생성)
  await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
}
