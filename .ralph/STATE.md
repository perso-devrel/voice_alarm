# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P4 모바일 오프라인 지원 강화 완료 (Library 탭 + OfflineBanner 전역 적용)
- 최근 주요 변경:
  - offlineCache: LibraryItem 캐시 함수 추가 (cacheLibrary/getCachedLibrary)
  - Library 탭: 오프라인 캐시 fallback + "마지막 저장 데이터" 배너 표시
  - Tab Layout: OfflineBanner를 전역으로 추가 (모든 탭 상단에 표시)
  - 이전 iteration에서 Home/Alarms 탭 오프라인 지원은 이미 완료됨
  - 모든 typecheck + web build 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- 다음 루프: BACKLOG P4 모두 완료. 자가 생성 풀에서 새 항목 선택 필요.
