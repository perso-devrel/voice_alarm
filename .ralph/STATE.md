# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P1 컴포넌트 추출 + 초대코드 UI 완료
- 현재 Phase: **P1 완료 → P2 전환 준비**
- 전체 typecheck 통과

## 완료된 리팩토링

- **P0 Phase 1-A**: packages/web 전체 삭제 완료.
- **P0 Phase 1-B**: Pretendard 폰트 적용 완료.
- **P0 Phase 1-C**: 탭 8→5 축소 완료 (Home/Voices/Alarms/People/Settings).
- **P1 세그먼트**: People 탭 3-세그먼트 컨트롤 (Members/Friends/Requests) + 플랜별 분기.
- **P1 가족 알람**: `app/family-alarm/create.tsx` 생성.
- **P1 컴포넌트 추출**: `FamilyMemberRow.tsx`, `PeopleSkeletonCard.tsx` 추출 완료.
- **P1 초대코드 UI**: 멤버 세그먼트에 초대코드 발급/공유/취소 UI 추가 완료.
- **P1 i18n**: 초대코드 관련 12개 키 추가 (ko/en).

## 남은 리팩토링 목표

1. P0 Phase 1-B-2: fontWeight→fontFamily 마이그레이션 (낮은 우선순위)
2. P2: 캐릭터 스트릭 + 능력치 — **다음 작업**
3. P3: R2 스토리지 + FCM 푸시
4. P5: 커플 뷰 개선 (P1에서 이동)

## GitHub 이슈 매핑
- P0: #172, P1: #173, P2: #174, P3: #175, P4: #176

## 다음 루프 지시

**P2 (캐릭터 스트릭+능력치)로 전환하라.**
- 첫 단계: `packages/backend/src/lib/migrations.ts`에 마이그레이션 13 추가
  - characters 테이블에 `current_streak`, `longest_streak`, `last_wakeup_date` 컬럼 추가
  - `character_stats` 테이블 신규
  - `streak_achievements` 테이블 신규
- 마이그레이션 코드만 작성하고 typecheck 통과시키는 것이 한 iteration 분량.

## 알려진 이슈
- [blocked] Perso API 404
- [blocked] ElevenLabs 통합 테스트
- FontFamily/fontForWeight 중복
