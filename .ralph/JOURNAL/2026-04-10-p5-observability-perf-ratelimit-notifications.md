---
date: 2026-04-10
slug: p5-observability-perf-ratelimit-notifications
---

# P5 전체 완료: 관측성 + 코드 스플리팅 + Rate Limit + 푸시 알림

## 집은 BACKLOG 항목
- P5: 관측성 (로깅 + 에러 핸들러)
- P5: 웹 코드 스플리팅
- P5: API rate limiting
- P5: 모바일 푸시 알림 (expo-notifications)

## 접근 및 구현

### 1. 백엔드 관측성
- `middleware/logger.ts`: 모든 요청에 대해 구조화 JSON 로깅. requestId (8자 UUID), X-Request-Id 응답 헤더, method/path/status/ms/uid 기록. 상태코드 기반 console.log/warn/error 분기.
- `index.ts` onError: 미처리 에러를 잡아 에러 상세를 JSON으로 로깅 (stack 상위 5줄). 클라이언트에는 requestId만 포함한 500 응답.
- 판단: 개별 라우트에 try/catch 추가하지 않음 — onError가 충분. voice/tts처럼 DB 상태 업데이트 필요한 경우만 route-level catch 유지.

### 2. 웹 코드 스플리팅
- `App.tsx`: 6개 페이지를 React.lazy()로 dynamic import. Suspense fallback에 스피너.
- 결과: Vite 빌드 시 페이지별 청크 분리. 메인 번들 296KB → 196KB (gzip 기준 ~30% 감소).

### 3. API Rate Limiting
- `middleware/rateLimit.ts`: 인메모리 고정 윈도우 (60req/60s per user). userId 기반 (인증 후), IP 폴백.
- 응답 헤더: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After (429 시).
- 판단: Workers 환경에서 KV/DO 없이 인메모리로 구현. 단일 isolate 내에서만 유효하지만 burst 보호에 충분.

### 4. 모바일 푸시 알림
- `services/notifications.ts` 신규:
  - setNotificationHandler: 알림 수신 시 alert/sound/banner/list 표시
  - Android 알림 채널 'alarms' (MAX importance, vibration)
  - requestNotificationPermissions(): 권한 요청
  - syncAlarmNotifications(): 기존 예약 전부 취소 후 활성 알람 기반 재스케줄링
    - repeat_days 없으면 DAILY 트리거
    - repeat_days 있으면 요일별 WEEKLY 트리거
  - addNotificationResponseListener(): 알림 탭 이벤트 리스너
- `_layout.tsx`: 앱 시작 시 requestNotificationPermissions() 호출
- `alarms.tsx`: 알람 목록 fetch 성공 시 syncAlarmNotifications() 호출

## 변경 파일
1. `packages/backend/src/middleware/logger.ts` — 구조화 요청 로깅
2. `packages/backend/src/middleware/rateLimit.ts` — 인메모리 rate limiting
3. `packages/backend/src/index.ts` — loggerMiddleware + rateLimitMiddleware + onError
4. `packages/web/src/App.tsx` — React.lazy + Suspense 코드 스플리팅
5. `apps/mobile/src/services/notifications.ts` — 신규: 알람 알림 서비스
6. `apps/mobile/app/_layout.tsx` — 알림 권한 요청 추가
7. `apps/mobile/app/(tabs)/alarms.tsx` — 알람 fetch 시 알림 동기화

## 검증 결과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- 알림 탭 시 deep link 처리 미구현 (addNotificationResponseListener 내보냈으나 미연결)
- 알람 생성/수정/삭제 mutation 후 syncAlarmNotifications 미호출 (현재는 목록 refetch 시에만 동기화)
- Workers rate limiting은 isolate 재시작 시 리셋됨 — 높은 트래픽에서는 KV 기반 구현 필요
