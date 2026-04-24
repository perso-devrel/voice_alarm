# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P0 Phase 1-A 완료 (packages/web 삭제)
- 현재 Phase: **P0 Phase 1-B/1-C 진행 중**
- 전체 typecheck/lint 통과

## 완료된 리팩토링

- **P0 Phase 1-A**: packages/web 전체 삭제 완료. CI/CD, 문서, CORS, dependabot 등 모든 참조 정리됨.
- **P0 Phase 1-B**: Pretendard 폰트 적용 (커밋 4711217에서 완료 — 확인 필요)

## 남은 리팩토링 목표

1. **P0 Phase 1-C**: 탭 8개→5개 축소 (character/library → 스택, friends/family → people)
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

**P0 Phase 1-B 완료 여부 확인 후 Phase 1-C (탭 축소)로 진행하라.**
- Phase 1-B가 이미 완료(커밋 4711217)라면 BACKLOG에 체크 후 Phase 1-C 시작
- Phase 1-C: character/library 탭 → 스택 화면 이동, friends/family 탭 삭제 → people 탭 추가

## 알려진 이슈
- [blocked] Perso API 404 (외부 API 문서 접근 필요)
- [blocked] ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
- invites.ts의 INVITE_WEB_HOST는 유니버설 링크용으로 유지 중 — 향후 랜딩 페이지 호스트로 변경 검토
