---
date: 2026-04-10
slug: p35-middleware-tests
---

# P33 완료 + P35 미들웨어 테스트

## 집은 BACKLOG 항목
- P33: library.test.ts (src/routes/) 추가 — 마지막 미완료 항목
- P35: 미들웨어 테스트 커버리지 (rateLimit, logger, cache)

## 변경 파일
- `src/routes/library.test.ts` (신규) — 14개 테스트
  - GET: 목록/빈목록/limit-offset/max clamp/favorite필터/voice필터/date필터
  - PATCH /:id/favorite: UUID검증/404/0→1/1→0
  - DELETE: UUID검증/404/성공

- `src/middleware/rateLimit.test.ts` (신규) — 6개 테스트
  - 기본 허용 + 헤더, 카운트 감소, 429 반환, userId 키 분리, IP 폴백
  - 주의: 모듈 레벨 Map 공유로 테스트간 고유 userId 필요

- `src/middleware/logger.test.ts` (신규) — 6개 테스트
  - 구조화 JSON 로그, X-Request-Id 헤더, 4xx→warn, 5xx→error, userId 포함/미포함

- `src/middleware/cache.test.ts` (신규) — 7개 테스트
  - cacheControl: 성공시 설정/에러시 스킵/Vary 설정/Vary 생략
  - 프리셋: publicCache/privateCache/noStore

## 검증 결과
- `npx vitest run` — 200 tests all pass (33 new)
- `npx tsc --noEmit` — 통과
- web/mobile typecheck — 통과 (사전 확인)

## 다음 루프 주의사항
- P35 완료. BACKLOG 고갈 — 새 항목 생성 필요.
- tts.test.ts는 env 바인딩 수정이 적용된 상태 (createTtsApp + app.fetch(req, fakeEnv))
