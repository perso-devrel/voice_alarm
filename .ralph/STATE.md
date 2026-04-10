# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P11 진행 중 (3/4 완료)
- 최근 주요 변경:
  - 웹 GiftsPage에 accept/reject optimistic update 추가 (onMutate/onError 롤백)
  - 모바일 gift/received 화면에 skeleton loading + 리패치 dim UX 추가
  - 백엔드 alarm 라우트에 UUID 형식 검증 추가 (/:id, message_id)
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- P11 남은 항목: 모바일 알람 목록 스와이프 삭제 제스처
