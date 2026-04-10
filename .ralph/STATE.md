# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P37 완료 + P38 1/4 완료
- 최근 주요 변경:
  - 웹 SettingsPage에 계정 삭제 확인 다이얼로그 추가 ("삭제" 입력 확인 방식)
  - 모바일 홈 탭 stats 에러 상태 UI 추가 (에러 카드 + 탭하여 재시도)
  - 백엔드 DELETE /api/user/me 엔드포인트 신규 (7개 테이블 cascade 삭제)
  - 백엔드 deleteAccount() 웹 API 함수 추가
  - user.test.ts에 삭제 테스트 2개 추가 → 전체 212 tests all pass
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
- 다음 루프: P38 남은 항목 (모바일 설정 계정 삭제, 웹 에러 토스트 개선, auth 에러 메시지)
