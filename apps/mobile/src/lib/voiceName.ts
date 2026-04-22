export interface SanitizedVoiceName {
  ok: boolean;
  value: string;
  error?: string;
}

export function sanitizeVoiceName(raw: string): SanitizedVoiceName {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, value: '', error: '이름을 입력하세요.' };
  }
  if (trimmed.length > 50) {
    return { ok: false, value: trimmed, error: '이름은 50자 이하여야 합니다.' };
  }
  return { ok: true, value: trimmed };
}
