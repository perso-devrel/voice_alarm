import type { Client } from '@libsql/client/web';

export interface Migration {
  id: number;
  name: string;
  statements: string[];
}

export const migrations: Migration[] = [
  {
    id: 1,
    name: 'initial-schema',
    statements: [
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
      `CREATE TABLE IF NOT EXISTS dub_jobs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        source_message_id TEXT,
        source_language TEXT NOT NULL,
        target_language TEXT NOT NULL,
        status TEXT DEFAULT 'uploading' CHECK(status IN ('uploading','processing','ready','failed')),
        perso_space_seq INTEGER,
        perso_project_seq INTEGER,
        perso_media_seq INTEGER,
        result_message_id TEXT,
        progress INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      // Indexes
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
      'CREATE INDEX IF NOT EXISTS idx_dub_jobs_user ON dub_jobs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_dub_jobs_status ON dub_jobs(status)',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)',
    ],
  },
];

export async function runMigrations(db: Client): Promise<string[]> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )`
  );

  const applied = await db.execute('SELECT id FROM _migrations ORDER BY id');
  const appliedIds = new Set(applied.rows.map((r) => Number(r.id)));

  const ran: string[] = [];

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) continue;

    for (const stmt of migration.statements) {
      await db.execute(stmt);
    }

    await db.execute({
      sql: 'INSERT INTO _migrations (id, name) VALUES (?, ?)',
      args: [migration.id, migration.name],
    });

    ran.push(`${migration.id}_${migration.name}`);
  }

  return ran;
}
