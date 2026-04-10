# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P7 스누즈 확인 + API 캐싱 미들웨어 추가
- 최근 주요 변경:
  - backend: Cache-Control 미들웨어 신규 (public/private/no-store)
  - backend: 프리셋 엔드포인트 publicCache, 인증 API에 privateCache/noStore 적용
  - mobile: notifications.ts 스누즈 관련 변경 (이전 루프에서 구현, 미커밋 상태)
  - 모든 typecheck 통과 (backend + mobile)
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- 다음 루프: P7 마지막 — 음성 메시지 파형(waveform) 시각화 플레이어
