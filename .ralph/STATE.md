# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P7 알람 스누즈 동작 구현 완료
- 최근 주요 변경:
  - notifications.ts: 알림 카테고리 등록 (스누즈/끄기 액션 버튼), snoozeMinutes data 포함, scheduleSnoozeNotification 함수 추가
  - _layout.tsx: 스누즈 액션 핸들링 (N분 후 재알림 스케줄링)
  - 알림에 categoryIdentifier 설정 (daily/weekly 트리거 모두)
  - 웹 반응형 레이아웃 완료 (다른 루프)
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- 다음 루프: P7 나머지 (API 캐싱, 파형 시각화)
