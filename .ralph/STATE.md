# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P7 API 캐싱 완료 (Cache-Control + stale-while-revalidate + Vary)
- 최근 주요 변경:
  - backend: cache.ts에 stale-while-revalidate, Vary: Authorization 추가
  - backend: publicCache s-maxage=86400 (CDN 24시간 캐시), privateCache swr=60
  - cache.ts 파일이 이번에 처음 git 추적됨 (이전 루프에서 생성되었으나 미커밋)
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- 다음 루프: P7 마지막 — 음성 메시지 파형(waveform) 시각화 플레이어
