---
date: 2026-04-10
slug: p4-backend-unit-tests
---

# P4: 백엔드 유닛 테스트 — friend/gift/alarm 라우트 (확장)

## 집은 BACKLOG 항목
- P4: 백엔드 유닛 테스트: friend/gift/alarm 라우트 핵심 로직 테스트 (vitest)

## 접근
- 이전 iteration에서 src/routes/*.test.ts (co-located) 형태로 기초 테스트 43개 작성
- 이번 iteration에서 test/ 디렉토리에 별도 테스트 파일 3개 추가 (helpers + friend/gift/alarm)
- Hono의 `app.request()` + `vi.mock('../src/lib/db')` 으로 DB mock
- `fakeAuthMiddleware`로 인증 우회
- vitest.config.ts의 include에 `test/**/*.test.ts` 추가

## 변경 파일
1. `packages/backend/test/helpers.ts` — 신규: MockDB, fakeAuth, jsonReq 헬퍼
2. `packages/backend/test/friend.test.ts` — 신규: 11개 테스트 (POST 6, GET 3, PATCH 1, DELETE 1)
3. `packages/backend/test/gift.test.ts` — 신규: 12개 테스트 (POST 7, GET 2, PATCH 2, reject 1)
4. `packages/backend/test/alarm.test.ts` — 신규: 14개 테스트 (GET 2, POST 7, PATCH 3, DELETE 2)
5. `packages/backend/vitest.config.ts` — include에 `test/**/*.test.ts` 추가

## 검증 결과
- `npx vitest run` — 6 test files, 90 tests all passed (895ms)
- `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- 총 90개 테스트 (src/ 43 + test/ 47)
- MockDB의 pushResult 순서가 라우트 내 execute 호출 순서와 일치해야 함
- 통합 테스트(실제 DB)는 P1에서 별도 진행
