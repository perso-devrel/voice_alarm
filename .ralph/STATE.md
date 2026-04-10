# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P12 진행 중 (3/4 완료)
- 최근 주요 변경:
  - 모바일 음성 탭에 스와이프 삭제 제스처 추가
  - 백엔드 friend/gift/library 라우트에 UUID 형식 검증 추가
  - 웹 AlarmsPage에 삭제/토글 낙관적 업데이트 추가
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- P12 남은 항목: 모바일 선물 수락 → 알람 설정 바로가기
