# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P24 완료 + P25 진행 중
- 최근 주요 변경:
  - 웹: 메시지 삭제 시 409 처리 (연관 알람 경고 → force confirm)
  - 모바일: 홈 탭 "다음 알람" 카드 → 알람 편집/생성 화면으로 이동
  - 모바일: alarm/edit 스크린 _layout 등록
  - 백엔드: GET /api/gift/received, /sent에 q= 검색 파라미터 추가
  - 백엔드: GET /api/tts/messages에 voice_profile_id 필터 추가
  - 모바일: 음성 프로필 상세 화면 (voice/[id].tsx)
  - 전체 typecheck/build 통과 확인
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - P25 남은 항목: 대시보드 활동→음성 상세 모달 연동
- 다음 루프: P25 완료 후 P26 생성
