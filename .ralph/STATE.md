# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P4 모바일 오프라인 지원 강화 완료
- 최근 주요 변경:
  - @react-native-community/netinfo 설치 + useNetworkStatus 훅 생성
  - offlineCache 서비스: 알람/메시지/라이브러리 데이터를 AsyncStorage에 캐싱
  - OfflineBanner 컴포넌트: 오프라인 시 상단 경고 배너 표시
  - 홈 화면 + 알람 탭: 오프라인 시 캐시 데이터 표시 (graceful degradation)
  - i18n에 오프라인 관련 키 추가 (ko/en)
  - 모든 typecheck + web build 통과
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
  - ESLint warnings 5개 (react-hooks/exhaustive-deps — 의도적 mount-only effects)
- 다음 루프: BACKLOG P4 완료, 자가 생성 풀에서 새 항목 선택
