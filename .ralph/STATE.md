# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P1 가족 알람 폼 분리 완료
- 현재 Phase: **P1 마무리 (컴포넌트 추출 + 초대코드 UI)**
- 전체 typecheck 통과

## 완료된 리팩토링

- **P0 Phase 1-A**: packages/web 전체 삭제 완료.
- **P0 Phase 1-B**: Pretendard 폰트 적용 완료.
- **P0 Phase 1-C**: 탭 8→5 축소 완료 (Home/Voices/Alarms/People/Settings).
- **P1 세그먼트**: People 탭 3-세그먼트 컨트롤 (Members/Friends/Requests) + 플랜별 분기.
- **P1 가족 알람**: `app/family-alarm/create.tsx` 생성. 수신자 선택, 시간, 메시지, 반복요일 폼.

## 남은 P1 항목

1. **컴포넌트 추출**: FamilyMemberRow, PeopleSkeletonCard
2. **초대코드 발급 UI**: 멤버 세그먼트에서 초대코드 생성 + 공유
3. **커플 뷰 개선**: 2인 전용 간결한 카드 레이아웃
4. 초대코드 관련 i18n 키 추가

## 남은 리팩토링 목표

1. P0 Phase 1-B-2: fontWeight→fontFamily 마이그레이션 (낮은 우선순위)
2. P1 나머지: 컴포넌트 추출 + 초대코드 UI
3. P2: 캐릭터 스트릭 + 능력치
4. P3: R2 스토리지 + FCM 푸시

## GitHub 이슈 매핑
- P0: #172, P1: #173, P2: #174, P3: #175, P4: #176

## 다음 루프 지시

**P1 컴포넌트 추출로 진행하라.**
- `src/components/FamilyMemberRow.tsx` 추출
- `src/components/PeopleSkeletonCard.tsx` 추출
- 초대코드 발급 UI (멤버 세그먼트)
- 항목이 작으므로 P2로의 전환도 가능

## 알려진 이슈
- [blocked] Perso API 404
- [blocked] ElevenLabs 통합 테스트
- FontFamily/fontForWeight 중복
