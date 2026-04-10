# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — 웹 로그아웃 버그 수정 (firebase_token → auth_token)
- 최근 주요 변경:
  - P0 전체 완료: Friends + Gifts + Cross-User Alarm
  - P1 완료: validation, 에러 UI, E2E 가이드
  - P2 완료: README, CI, CHANGELOG, ARCHITECTURE
  - P3 완료: any 0개 (전 패키지), 의존성 점검 완료, 코드 중복 검토 완료
  - 버그 수정: SettingsPage 로그아웃 시 잘못된 토큰 키 사용
  - 모든 typecheck + web build 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - 배포 DB에 init-db 재호출 필요
- 다음 루프: P3 번들 크기 줄이기 또는 자가 생성 풀에서 새 항목
