# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-10 — P39 완료 (Toast 추출 + 에러 UX 개선)
- 현재 Phase: **리팩토링 시작 전** (P0~P39 기존 작업 모두 완료)
- 전체 typecheck/build 통과

## 새로운 리팩토링 목표 (기획서 정렬)

기획서(Notion)에 맞게 프로젝트를 정비하는 4단계 리팩토링이 BACKLOG에 등록됨:

1. **P0 - 정리**: packages/web 삭제 + 탭 8개→5개 축소
2. **P1 - People 탭**: Friends+Family 통합 → 단일 "내 사람들" 탭
3. **P2 - 캐릭터**: 나무 테마 강화 + 연속 기상 스트릭 + 능력치
4. **P3 - 배포**: R2 스토리지 + FCM 푸시 구조 + 서비스화

## GitHub 이슈 매핑
- P0: #172 — web 삭제 + 탭 축소
- P1: #173 — People 탭 통합
- P2: #174 — 캐릭터 스트릭+능력치
- P3: #175 — R2/FCM/배포
- P4: #176 — 기획서 동기화+정비

## 다음 루프 지시

**P0 Phase 1-A (packages/web 삭제)부터 시작하라.** (이슈 #172)
- packages/web 디렉토리 삭제
- 관련 CI/CD, 문서, CORS 참조 정리
- npm install + lint + typecheck 통과 확인
- 커밋 메시지에 `closes #172` 포함 (Phase 1-B까지 완료 후)

## 알려진 이슈
- [blocked] Perso API 404 (외부 API 문서 접근 필요)
- [blocked] ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
