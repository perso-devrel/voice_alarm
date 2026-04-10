# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P12 전체 완료
- 최근 주요 변경:
  - 백엔드 tts.ts: voice_profile_id UUID 검증 추가
  - 백엔드 gift.ts: message_id UUID 검증 추가
  - 모바일 alarm/create.tsx: useLocalSearchParams로 message_id 파라미터 수신 지원
  - 모바일 gift/received.tsx: 수락된 선물에 "알람으로 설정" 바로가기 버튼 추가
  - 웹 AlarmsPage: 삭제/토글 낙관적 업데이트 (이전 루프에서 기완료 확인)
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- P12 전체 완료. P13 생성 완료
- 다음 루프: P13 첫 항목 — 모바일 메시지 라이브러리 스와이프 삭제
