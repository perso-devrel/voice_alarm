# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P23 전체 완료
- 최근 주요 변경:
  - 웹: GiftsPage 보낸 선물에 노트 표시 추가
  - 백엔드: GET /api/alarm/:id 단일 알람 조회 엔드포인트 추가
  - 모바일: 음성 프로필 상세 화면 신규 (voice/detail.tsx — 메시지/알람 목록)
  - 모바일: voices 탭에서 프로필 탭 시 상세 화면 이동
  - 백엔드: GET /messages에 voice_profile_id 쿼리 필터 추가
  - 전체 typecheck/build 통과 확인
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - 모바일/웹에서 메시지 삭제 시 409 응답 처리 미구현
- 다음 루프: P24 생성 후 진행
