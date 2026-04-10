# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P3 번들 최적화 + P4 i18n 구축
- 최근 주요 변경:
  - axios 제거 → native fetch 교체 (번들 ~13KB 절감)
  - i18n 인프라 구축: i18next + react-i18next + expo-localization
  - 한국어/영어 번역 파일 (282줄/282줄) — 전 화면 번역 키 포함
  - 적용 완료 화면: home, _layout, (tabs)/_layout, alarms
  - 미적용 화면: voices, friends, library, settings, onboarding, 모달 화면들
  - 모든 typecheck 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
- 다음 루프: 나머지 화면에 i18n t() 적용 (voices, friends, library, settings, 모달)
