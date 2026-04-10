# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P3 번들 크기 최적화 (axios → native fetch)
- 최근 주요 변경:
  - 모바일 api.ts: axios 제거, native fetch 기반 HTTP 클라이언트로 전면 교체
  - 모든 API 함수에 명시적 타입 반환 (VoiceProfile[], Alarm[], Friend[] 등)
  - ApiError 클래스 + getApiErrorMessage 유틸 통일
  - 6개 컴포넌트 에러 핸들러 패턴 일괄 정리
  - P0~P3 전체 완료, 모든 typecheck + web build 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - 배포 DB에 init-db 재호출 필요
- 다음 루프: 자가 생성 풀에서 새 항목 (i18n, 접근성, 테스트 보강 등)
