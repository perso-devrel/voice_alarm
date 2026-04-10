# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — 백엔드 구조화된 로깅 미들웨어 + 글로벌 에러 핸들러 추가
- 최근 주요 변경:
  - middleware/logger.ts: 전역 요청 로깅 (JSON, requestId, duration, userId)
  - index.ts: loggerMiddleware 등록 + app.onError() 글로벌 핸들러
  - 모든 typecheck + web build 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- 다음 루프: 자가 생성 풀에서 추가 항목 선택 (추가 리팩터, 성능 프로파일링 등)
