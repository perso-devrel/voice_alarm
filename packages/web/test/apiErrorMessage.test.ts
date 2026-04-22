import { describe, it, expect } from 'vitest';
import { getApiErrorMessage } from '../src/types';

describe('getApiErrorMessage', () => {
  it('axios 형태 에러에서 메시지 추출', () => {
    const err = { response: { data: { error: '잘못된 요청' } } };
    expect(getApiErrorMessage(err, '기본')).toBe('잘못된 요청');
  });

  it('response.data.error 가 없으면 fallback', () => {
    const err = { response: { data: {} } };
    expect(getApiErrorMessage(err, '기본 에러')).toBe('기본 에러');
  });

  it('response 가 없으면 fallback', () => {
    expect(getApiErrorMessage({}, '폴백')).toBe('폴백');
  });

  it('null 이면 fallback', () => {
    expect(getApiErrorMessage(null, '폴백')).toBe('폴백');
  });

  it('undefined 이면 fallback', () => {
    expect(getApiErrorMessage(undefined, '폴백')).toBe('폴백');
  });

  it('Error 객체면 fallback (response 없음)', () => {
    expect(getApiErrorMessage(new Error('boom'), '에러 발생')).toBe('에러 발생');
  });
});
