import { validateEmailPasswordForm } from '../src/lib/authFormValidation';

describe('validateEmailPasswordForm', () => {
  it('로그인: 이메일/비밀번호 모두 있으면 null', () => {
    expect(
      validateEmailPasswordForm({
        mode: 'login',
        email: 'a@b.com',
        password: 'anything',
        name: '',
      }),
    ).toBeNull();
  });

  it('로그인: 이메일 공백이면 "모든 필드" 에러', () => {
    expect(
      validateEmailPasswordForm({
        mode: 'login',
        email: '   ',
        password: 'pw',
        name: '',
      }),
    ).toContain('모든 필드');
  });

  it('로그인: 비밀번호 누락이면 에러', () => {
    expect(
      validateEmailPasswordForm({
        mode: 'login',
        email: 'a@b.com',
        password: '',
        name: '',
      }),
    ).toContain('모든 필드');
  });

  it('가입: 이름 누락이면 에러', () => {
    expect(
      validateEmailPasswordForm({
        mode: 'register',
        email: 'a@b.com',
        password: 'superSecret1',
        name: '',
      }),
    ).toContain('모든 필드');
  });

  it('가입: 비밀번호가 8자 미만이면 "8자" 에러', () => {
    expect(
      validateEmailPasswordForm({
        mode: 'register',
        email: 'a@b.com',
        password: 'short',
        name: '홍길동',
      }),
    ).toContain('8자');
  });

  it('가입: 이메일·비번(8자 이상)·이름 모두 있으면 null', () => {
    expect(
      validateEmailPasswordForm({
        mode: 'register',
        email: 'a@b.com',
        password: 'eightchars1',
        name: '홍길동',
      }),
    ).toBeNull();
  });

  it('로그인 모드에서는 비밀번호 길이 제한을 걸지 않는다', () => {
    expect(
      validateEmailPasswordForm({
        mode: 'login',
        email: 'a@b.com',
        password: 'pw',
        name: '',
      }),
    ).toBeNull();
  });
});
