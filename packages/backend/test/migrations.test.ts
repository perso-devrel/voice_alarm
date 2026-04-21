import { describe, it, expect } from 'vitest';
import { migrations, type Migration } from '../src/lib/migrations';

describe('migrations', () => {
  it('마이그레이션 ID가 순차적이고 고유하다', () => {
    const ids = migrations.map((m) => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);

    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).toBeGreaterThan(ids[i - 1]);
    }
  });

  it('모든 마이그레이션에 이름과 SQL이 있다', () => {
    for (const m of migrations) {
      expect(m.name).toBeTruthy();
      expect(m.statements.length).toBeGreaterThan(0);
    }
  });

  it('초기 마이그레이션(0001)에 8개 테이블 생성이 포함된다', () => {
    const initial = migrations.find((m) => m.id === 1);
    expect(initial).toBeDefined();

    const createStatements = initial!.statements.filter((s) => s.trim().startsWith('CREATE TABLE'));
    expect(createStatements.length).toBe(8);
  });

  it('초기 마이그레이션(0001)에 인덱스 생성이 포함된다', () => {
    const initial = migrations.find((m) => m.id === 1);
    expect(initial).toBeDefined();

    const indexStatements = initial!.statements.filter(
      (s) => s.trim().startsWith('CREATE INDEX') || s.trim().startsWith('CREATE UNIQUE INDEX'),
    );
    expect(indexStatements.length).toBe(19);
  });

  it('Migration 타입 인터페이스가 올바르다', () => {
    const sample: Migration = { id: 999, name: 'test', statements: ['SELECT 1'] };
    expect(sample.id).toBe(999);
    expect(sample.name).toBe('test');
  });

  it('마이그레이션 #2 에서 users 테이블 재생성 + password_hash 추가', () => {
    const m = migrations.find((x) => x.id === 2);
    expect(m).toBeDefined();
    const all = m!.statements.join('\n');
    expect(all).toContain('users_new');
    expect(all).toContain('password_hash');
    expect(all).toContain('idx_users_email_unique');
  });

  it('마이그레이션 #3 에서 voice_uploads 테이블과 인덱스를 추가한다', () => {
    const m = migrations.find((x) => x.id === 3);
    expect(m).toBeDefined();
    const all = m!.statements.join('\n');
    expect(all).toContain('CREATE TABLE IF NOT EXISTS voice_uploads');
    expect(all).toContain('object_key');
    expect(all).toContain('size_bytes');
    expect(all).toContain('idx_voice_uploads_user');
  });

  it('마이그레이션 #4 에서 voice_speakers 테이블과 인덱스를 추가한다', () => {
    const m = migrations.find((x) => x.id === 4);
    expect(m).toBeDefined();
    const all = m!.statements.join('\n');
    expect(all).toContain('CREATE TABLE IF NOT EXISTS voice_speakers');
    expect(all).toContain('upload_id');
    expect(all).toContain('confidence');
    expect(all).toContain('idx_voice_speakers_upload');
  });
});
