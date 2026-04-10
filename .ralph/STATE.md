# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P4 i18n Phase 1 완료 (탭 화면 + 공용 컴포넌트 다국어 적용)
- 최근 주요 변경:
  - ko.json/en.json 전면 확장 (220+ 키, 모든 화면 번역 키 포함)
  - 탭 화면 전체(alarms, voices, friends, library, settings, tabs/_layout) + 공용 컴포넌트(QueryStateView, LoginButtons) i18n 적용 완료
  - 적용 완료: home, _layout, (tabs)/_layout, alarms, voices, friends, library, settings, QueryStateView, LoginButtons
  - 미적용: onboarding, alarm/create, message/create, gift/received, voice/record, voice/upload, voice/diarize, player
  - 모든 typecheck 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
- 다음 루프: P4 i18n Phase 2 — sub-screen 8개 파일에 t() 적용
