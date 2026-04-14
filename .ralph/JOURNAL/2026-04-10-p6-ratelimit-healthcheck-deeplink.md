---
date: 2026-04-10
slug: p6-ratelimit-healthcheck-deeplink
---

# P6: Rate Limiting + 헬스체크 DB + 알림 Deep Link

## 집은 BACKLOG 항목
- P5: 코드 스플리팅 (이미 완료 확인)
- P5: API rate limiting (구현)
- P6: 헬스체크에 DB 연결 상태 (구현)
- P6: 알림 탭 → 플레이어 deep link (구현)
- P6: 알람 CRUD 시 알림 재동기화 (이미 완료 확인)

## 접근

### Rate Limiting
인메모리 Map 기반 고정 윈도우 방식. Workers 환경에서 isolate 간 메모리 공유 안 되지만 기본 보호로 충분.
- 60 req/min per IP (글로벌 미들웨어, auth 전 위치)
- X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset 헤더
- 429 응답 시 Retry-After 포함
- 5분 간격 expired entry cleanup

### 헬스체크 DB
`GET /` 에서 `SELECT 1` 실행하여 DB 연결 확인. 실패 시 status: "degraded" 반환 (500이 아님 — API 자체는 살아있으므로).

### 알림 Deep Link
- notifications.ts: 알림 data에 text, voiceName, category 추가 (기존 alarmId, messageId에 더해)
- _layout.tsx: addNotificationResponseListener 등록, 알림 탭 시 /player 화면으로 router.push

### 이미 완료 확인
- 웹 코드 스플리팅: React.lazy + Suspense 적용됨, 페이지별 3-6KB 청크
- 알람 CRUD 재동기화: toggle/delete mutation의 onSuccess에서 resyncNotifications() 호출

## 변경 파일
1. `packages/backend/src/middleware/rateLimit.ts` — 신규
2. `packages/backend/src/index.ts` — import + 글로벌 등록 + 헬스체크 개선
3. `apps/mobile/src/services/notifications.ts` — 알림 data 확장
4. `apps/mobile/app/_layout.tsx` — notification response listener 등록

## 검증 결과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- 웹 다크모드 지원 (P6 마지막 항목)이 남아있음
- rate limiting은 프로덕션에서 Cloudflare dashboard Rules로 보완 권장
