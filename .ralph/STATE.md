# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P11 전체 완료
- 최근 주요 변경:
  - 백엔드 alarm 라우트: repeat_days/snooze_minutes에 정수 검증, is_active에 boolean 검증 추가
  - 모바일 alarms 탭: Swipeable 스와이프 삭제 제스처 추가 (react-native-gesture-handler)
  - 웹 GiftsPage optimistic update / 모바일 gift skeleton — 기완료 확인
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- P11 전체 완료. P12 생성 완료
- 다음 루프: P12 첫 항목 — 모바일 음성 목록 스와이프 삭제
