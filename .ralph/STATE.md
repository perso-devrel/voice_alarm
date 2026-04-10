# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P25 + P26 전체 완료
- 최근 주요 변경:
  - 웹: DashboardPage + AlarmsPage에서 음성 프로필 클릭 시 VoiceDetailModal 열기
  - 백엔드: GET /api/voice에 status 필터 쿼리 파라미터 추가
  - 모바일: 설정 화면에 알림 권한 상태 표시 + 허용 안 됐을 시 권한 요청/설정 이동
  - 전체 typecheck/build 통과 확인 (backend, web, mobile 3개 모두)
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
- 다음 루프: P27 항목 진행
