---
date: 2026-04-10
slug: observability-structured-logging
---

# Observability: Backend Structured Logging + Global Error Handler

## 집은 BACKLOG 항목
- 자가 생성 풀: 관측성 (로깅/에러 리포팅)

## 접근

기존 상태: 백엔드에 로깅 미들웨어 없음. 에러는 각 라우트에서 인라인 try/catch 또는 Hono 기본 핸들러에 의존.

### 구현 내역
1. **`middleware/logger.ts`** — 구조화된 요청 로깅 미들웨어
   - 모든 요청에 8자 requestId 생성 + `X-Request-Id` 응답 헤더
   - 요청 완료 시 JSON 로그: method, path, status, duration(ms), userId
   - 에러 시 stack trace 포함 (3줄로 제한)
   - Cloudflare Workers Logs에서 자동 수집됨
2. **`index.ts`** — loggerMiddleware를 전역 최상단에 등록
3. **`index.ts`** — `app.onError()` 글로벌 에러 핸들러
   - 미처리 에러를 500 JSON 응답으로 변환
   - requestId 포함하여 클라이언트가 지원팀에 전달 가능
4. **`types.ts`** — 변경 없음 (requestId는 응답 헤더로 전달)

### 판단 기록
- Cloudflare Workers는 console.log/warn/error를 자동 수집하므로 별도 로깅 라이브러리 불필요
- requestId를 c.set 대신 응답 헤더로 전달 — 타입 변경 최소화, 클라이언트에서도 추적 가능
- 로그 키를 축약 (rid, ms, uid) — Workers 로그 비용/크기 절감

## 변경 파일
1. `packages/backend/src/middleware/logger.ts` — 신규
2. `packages/backend/src/index.ts` — loggerMiddleware 등록 + onError 핸들러

## 검증 결과
- Backend `npx tsc --noEmit` — 통과
- Mobile `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- Workers Logs 대시보드에서 구조화된 JSON 로그 필터링 가능
- 추후 Sentry/Logflare 등 외부 서비스 연동 시 logger.ts에서 fetch 추가하면 됨
