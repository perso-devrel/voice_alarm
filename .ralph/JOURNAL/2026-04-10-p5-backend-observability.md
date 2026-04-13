---
date: 2026-04-10
slug: p5-backend-observability
---

# P5: 백엔드 구조화된 로깅 + 글로벌 에러 핸들러

## 집은 BACKLOG 항목
- P5: 관측성: 백엔드 구조화된 로깅 미들웨어 + 글로벌 에러 핸들러

## 접근
기존 상태: 로깅 0, 에러 핸들링은 voice/tts/auth에만 try/catch 존재. alarm/user/friend/gift/library 라우트는 DB 에러 시 unhandled throw.

### 구현 내역
1. **middleware/logger.ts 개선** — 이전 iteration에서 생성되었으나 미연결. `c.set('requestId')` + `X-Request-Id` 헤더 + 구조화 JSON 로깅 (rid, method, path, status, ms, uid). 상태코드 기반 console.log/warn/error 분기.
2. **index.ts에 loggerMiddleware 등록** — CORS 전에 배치하여 모든 요청 캡처.
3. **app.onError() 글로벌 핸들러** — 라우트에서 throw된 미처리 에러를 캡처. 에러 상세를 JSON으로 로깅 (rid, method, path, error, stack 상위 5줄). 클라이언트에는 requestId만 포함한 500 응답 반환 (에러 상세 미노출).

### 판단 기록
- 개별 라우트에 try/catch를 추가하지 않음 — onError가 모든 미처리 에러를 잡아주므로 코드 중복 불필요. voice/tts처럼 실패 시 DB 상태 업데이트가 필요한 경우만 route-level try/catch 유지.
- logger에서 catch/rethrow 패턴 대신 await next() 후 로깅 — onError가 먼저 응답을 세팅하므로 logger의 post-next 코드에서 최종 status를 볼 수 있음.
- stack trace는 5줄로 자르고 `|`로 합침 — Workers 로그에서 한 줄로 보이도록.

## 변경 파일
1. `packages/backend/src/middleware/logger.ts` — 구조화 요청 로깅 (개선)
2. `packages/backend/src/index.ts` — loggerMiddleware 등록 + onError 핸들러

## 검증 결과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- Workers 실제 배포 후 `wrangler tail`로 로그 포맷 확인 필요
- rate limiting이 다음 자연스러운 관측성 확장점
