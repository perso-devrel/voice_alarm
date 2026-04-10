# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P5 전체 완료 (관측성 + 코드 스플리팅 + rate limit + 푸시 알림)
- 최근 주요 변경:
  - middleware/logger.ts: 전역 요청 로깅 (JSON structured, X-Request-Id, timing, userId)
  - middleware/rateLimit.ts: 인메모리 고정 윈도우 (60req/60s), userId/IP 기반, X-RateLimit-* 헤더
  - index.ts: loggerMiddleware + rateLimitMiddleware + app.onError() 통합
  - App.tsx (web): React.lazy + Suspense 코드 스플리팅 (메인 번들 296KB→196KB)
  - notifications.ts (mobile): expo-notifications 기반 알람 스케줄링 서비스
  - _layout.tsx: 앱 시작 시 알림 권한 요청
  - alarms.tsx: 알람 목록 fetch 시 로컬 알림 자동 동기화
  - 모든 typecheck + web build 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- 다음 루프: P6 — 알림 deep link, 헬스체크 DB, 알람 CRUD 시 알림 재동기화, 다크모드 등
