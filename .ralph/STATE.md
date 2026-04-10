# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P4 백엔드 유닛 테스트 확장 완료
- 최근 주요 변경:
  - test/ 디렉토리에 friend/gift/alarm 유닛 테스트 47개 추가 (helpers.ts 포함)
  - 총 90개 테스트 (기존 src/ 43 + 신규 test/ 47) 전부 통과
  - vitest.config.ts에 test/ include 추가
  - 모든 typecheck 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - PRESET_CATEGORIES의 카테고리 라벨/메시지는 아직 한국어 하드코딩
- 다음 루프: P4 웹 접근성 또는 ESLint/Prettier 설정 통일
