import { describe, expect, it } from 'vitest';
import { InMemoryVoiceStorage, StoredObjectSchema } from '../src/index.js';

describe('InMemoryVoiceStorage.store', () => {
  it('새 객체를 저장하면 고유 objectKey 와 메타를 돌려준다', async () => {
    const storage = new InMemoryVoiceStorage();
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const meta = await storage.store({
      userId: 'u_1',
      bytes,
      mimeType: 'audio/mpeg',
      durationMs: 2500,
      originalName: 'hello.mp3',
    });
    expect(() => StoredObjectSchema.parse(meta)).not.toThrow();
    expect(meta.sizeBytes).toBe(5);
    expect(meta.objectKey.startsWith('mem://u_1/')).toBe(true);
    expect(storage.size()).toBe(1);
  });

  it('연속 호출 시 objectKey 는 서로 다르다', async () => {
    const storage = new InMemoryVoiceStorage();
    const a = await storage.store({
      userId: 'u_1',
      bytes: new Uint8Array([1]),
      mimeType: 'audio/wav',
    });
    const b = await storage.store({
      userId: 'u_1',
      bytes: new Uint8Array([2]),
      mimeType: 'audio/wav',
    });
    expect(a.objectKey).not.toBe(b.objectKey);
  });

  it('get/delete 로 저장 내용 조회·삭제가 동작한다', async () => {
    const storage = new InMemoryVoiceStorage();
    const meta = await storage.store({
      userId: 'u_1',
      bytes: new Uint8Array([9, 9]),
      mimeType: 'audio/mpeg',
    });
    const got = await storage.get(meta.objectKey);
    expect(got).not.toBeNull();
    expect(got?.bytes.byteLength).toBe(2);

    const ok = await storage.delete(meta.objectKey);
    expect(ok).toBe(true);
    expect(await storage.get(meta.objectKey)).toBeNull();
  });

  it('userId 가 비어있으면 검증 실패', async () => {
    const storage = new InMemoryVoiceStorage();
    await expect(
      storage.store({
        userId: '',
        bytes: new Uint8Array([1]),
        mimeType: 'audio/mpeg',
      }),
    ).rejects.toThrow();
  });
});
