describe('mobile test runner', () => {
  it('jest 환경이 정상 동작한다', () => {
    expect(1 + 1).toBe(2);
  });

  it('기본 문자열 연산이 동작한다', () => {
    expect('Voice' + 'Alarm').toBe('VoiceAlarm');
  });
});
