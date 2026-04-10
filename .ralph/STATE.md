# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P15 완료, P16 완료, P17 진행 중 (3/5 완료)
- 최근 주요 변경:
  - 웹 알람 편집 UI 스누즈 슬라이더 추가
  - 웹 대시보드 신규 (통계 카드 + 최근 활동 타임라인 + 알림 배너)
  - 백엔드 GET /api/stats + /api/stats/activity 엔드포인트 신규
  - 모바일 홈탭에 요약 통계 카드 추가 (활성 알람, 메시지, 친구, 대기 선물)
  - 모바일 친구 프로필 TS 에러 수정 (colorScheme → Colors.light)
  - 웹 설정 페이지에 이름 표시 추가
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
- 다음 루프: P17 나머지 — 웹 StatCard 트렌드, 사용자 검색 API, 친구 자동완성
