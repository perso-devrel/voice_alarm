# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P0 Phase 1-B 완료 (Pretendard 폰트 적용)
- 현재 Phase: **P0 Phase 1-C 대기 (탭 축소)**
- 전체 typecheck 통과

## 완료된 리팩토링

- **P0 Phase 1-A**: packages/web 전체 삭제 완료. CI/CD, 문서, CORS, dependabot 등 모든 참조 정리됨.
- **P0 Phase 1-B**: Pretendard 폰트 적용 완료. 폰트 다운로드 + _layout.tsx 로딩 + 토큰 업데이트 + 홈/탭바 fontFamily 적용. 나머지 28개 파일 fontWeight 마이그레이션은 별도 태스크(Phase 1-B-2).

## 남은 리팩토링 목표

1. **P0 Phase 1-C**: 탭 8개→5개 축소 (character/library → 스택, friends/family → people)
2. **P0 Phase 1-B-2**: 전체 앱 fontWeight→fontFamily 마이그레이션 (28개 파일, 낮은 우선순위)
3. **P1 - People 탭**: Friends+Family 통합 → 단일 "내 사람들" 탭
4. **P2 - 캐릭터**: 나무 테마 강화 + 연속 기상 스트릭 + 능력치
5. **P3 - 배포**: R2 스토리지 + FCM 푸시 구조 + 서비스화

## GitHub 이슈 매핑
- P0: #172 — web 삭제 + 탭 축소
- P1: #173 — People 탭 통합
- P2: #174 — 캐릭터 스트릭+능력치
- P3: #175 — R2/FCM/배포
- P4: #176 — 기획서 동기화+정비

## 다음 루프 지시

**P0 Phase 1-C (탭 축소)로 진행하라.**
- character/library 탭 → 스택 화면으로 이동
- friends/family 탭 삭제 → people 탭 추가 (P1에서 상세 구현)
- 홈 화면 캐릭터 미니 위젯 + 최근 메시지 섹션은 1-C에 포함
- i18n 키 변경 필수 (tab.friends/family/character/library → tab.people)

## 알려진 이슈
- [blocked] Perso API 404 (외부 API 문서 접근 필요)
- [blocked] ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
- invites.ts의 INVITE_WEB_HOST는 유니버설 링크용으로 유지 중
- FontFamily/fontForWeight가 theme.ts와 packages/ui/tokens.ts에 중복 정의됨 (향후 통합 검토)
