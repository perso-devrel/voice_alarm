# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P6 진행: rate limiting 추가, 헬스체크 DB 포함, 알림 deep link 처리
- 최근 주요 변경:
  - middleware/rateLimit.ts: 인메모리 슬라이딩 윈도우 (60req/min per IP), X-RateLimit-* 헤더, 429 응답
  - index.ts: rateLimitMiddleware 글로벌 등록 + 헬스체크에 DB 연결 상태 (ok/degraded) 추가
  - notifications.ts: 알림 데이터에 text/voiceName/category 포함 (플레이어 deep link용)
  - _layout.tsx: addNotificationResponseListener로 알림 탭 → /player 화면 이동 구현
  - 알람 CRUD 시 알림 재동기화: 이미 구현 확인 (toggle/delete → resyncNotifications)
  - 모든 typecheck + web build 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- 다음 루프: P6 — 웹 다크모드 지원
