# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P30 알람 설정 모달 + P32 UI 개선 4건 완료
- 최근 주요 변경:
  - 웹: MessagesPage 메시지 상세 모달에 알람 설정 기능 (시간 + 반복 요일 + createAlarm)
  - 웹: AlarmsPage 알람 생성/편집 화면에 메시지 검색 필터 추가
  - 백엔드: DELETE /api/voice/:id에 연관 메시지 409 경고 (force=true 패턴)
  - 모바일: 친구 상세 화면에 "선물 보내기" 버튼 추가
  - 전체 typecheck + 웹 build 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 기존 테스트 53건 실패 (gift.test.ts 등 mock 불일치 — pre-existing)
  - 웹/모바일 미배포
- 다음 루프: P32 남은 항목 — 기존 테스트 실패 수정
