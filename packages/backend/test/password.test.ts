import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, applyPepper } from '../src/lib/password';

describe('password hashing', () => {
  it('같은 비밀번호라도 해시가 매번 달라야 한다 (salt 무작위)', async () => {
    const pepper = 'test-pepper';
    const a = await hashPassword('correct-horse', pepper);
    const b = await hashPassword('correct-horse', pepper);
    expect(a).not.toBe(b);
  });

  it('올바른 비밀번호와 페퍼로 검증 성공', async () => {
    const pepper = 'test-pepper';
    const hash = await hashPassword('correct-horse', pepper);
    expect(await verifyPassword('correct-horse', hash, pepper)).toBe(true);
  });

  it('잘못된 비밀번호는 검증 실패', async () => {
    const pepper = 'test-pepper';
    const hash = await hashPassword('correct-horse', pepper);
    expect(await verifyPassword('wrong', hash, pepper)).toBe(false);
  });

  it('다른 페퍼로는 검증 실패 (pepper가 해시에 영향)', async () => {
    const hash = await hashPassword('correct-horse', 'pepper-a');
    expect(await verifyPassword('correct-horse', hash, 'pepper-b')).toBe(false);
  });

  it('빈 해시는 검증 실패', async () => {
    expect(await verifyPassword('anything', '', 'pepper')).toBe(false);
  });

  it('applyPepper 는 페퍼를 비밀번호 뒤에 붙인다', () => {
    expect(applyPepper('pw', 'sauce')).toBe('pw::sauce');
  });
});
