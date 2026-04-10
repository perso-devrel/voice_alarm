---
date: 2026-04-10
slug: p4-backend-unit-tests
---

# P4: 백엔드 유닛 테스트 — friend/gift/alarm 라우트

## 집은 BACKLOG 항목
- P4: 백엔드 유닛 테스트: friend/gift/alarm 라우트 핵심 로직 테스트 (vitest)

## 접근
- vitest 설치 + vitest.config.ts 생성
- 테스트 전략: Hono의 `app.request()` 활용, `getDB` 모듈을 vi.mock()으로 모킹
- test-helper.ts에 MockDB, createTestApp (auth bypass), jsonReq 헬퍼 생성
- 각 라우트 파일 옆에 `.test.ts` 작성 (co-location)
- tsconfig.json에서 테스트 파일 exclude 처리 (vitest는 자체 TS 처리)

## 대안 검토
- @cloudflare/vitest-pool-workers 사용 검토 → Miniflare 의존성 무거움, 순수 유닛 테스트에는 과한 접근
- 통합 테스트 (실제 DB) → P1에서 별도 진행 예정

## 변경 파일
1. `packages/backend/package.json` — "test": "vitest run" 스크립트 추가, vitest dev dep 추가
2. `packages/backend/vitest.config.ts` — 신규 (globals, node env, include pattern)
3. `packages/backend/tsconfig.json` — exclude test files
4. `packages/backend/src/test-helper.ts` — 신규 (MockDB, createTestApp, jsonReq)
5. `packages/backend/src/routes/friend.test.ts` — 신규 (11 tests)
6. `packages/backend/src/routes/gift.test.ts` — 신규 (11 tests)
7. `packages/backend/src/routes/alarm.test.ts` — 신규 (12 tests) [추가: cross-user alarm 시나리오]

## 검증 결과
- `vitest run`: 3 files, 43 tests 전부 통과 (817ms)
- Backend `tsc --noEmit`: 통과
- Web `tsc --noEmit`: 통과
- Mobile `tsc --noEmit`: 통과

## 테스트 커버리지 요약
- **friend**: 이메일 검증, 존재하지 않는 유저, 자기 자신 요청, 이미 친구/대기, 성공 생성, 목록 조회, 대기 요청, 수락, 삭제
- **gift**: 이메일 검증, message_id 필수, note 길이, 수신자 미존재, 자기 선물, 비친구, 메시지 미소유, 성공 전송, 수신/발신 조회, 수락(라이브러리 추가), 거절
- **alarm**: 필수 필드, 시간 형식, 범위 밖 시간, repeat_days 검증, snooze 범위, 비친구 타겟, 무료 플랜 제한, 메시지 미존재, 성공 생성, cross-user 생성, 수정(소유 확인+검증), 삭제

## 다음 루프 주의사항
- vitest.config.ts에 `test/**/*.test.ts` 패턴도 포함됨 (linter가 추가)
- 통합 테스트(실제 DB)는 P1에서 별도 진행
- test-helper.ts는 다른 라우트 테스트에도 재사용 가능
