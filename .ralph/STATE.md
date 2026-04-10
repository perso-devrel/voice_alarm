# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P4 웹 접근성 보강 완료
- 최근 주요 변경:
  - 웹 대시보드 전 페이지에 aria-label, role, aria-selected, aria-pressed, aria-expanded 추가
  - VoicesPage 파일 드롭존에 keyboard 접근성 (role="button", tabIndex, onKeyDown)
  - 글로벌 focus-visible 아웃라인 스타일 + sr-only 유틸리티 추가
  - 모든 typecheck + build 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
- 다음 루프: P4 모바일 오프라인 지원 강화 또는 ESLint/Prettier 설정 통일
