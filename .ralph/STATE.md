# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P2 마이그레이션 13 (streak+stats 스키마) 완료
- 현재 Phase: **P2 진행 중 — 스트릭 로직 구현 대기**
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
- **P2 마이그레이션 13**: characters 테이블에 streak 컬럼 3개 추가, character_stats/streak_achievements 테이블 생성.

## 남은 리팩토링 목표

1. P0 Phase 1-B-2: fontWeight→fontFamily 마이그레이션 (낮은 우선순위)
2. P2: 스트릭 로직 (`streak.ts`) + XP 규칙 확장 — **다음 작업**
3. P2: API 확장 + 프론트엔드 캐릭터 화면 강화
4. P3: R2 스토리지 + FCM 푸시
5. P5: 커플 뷰 개선

## GitHub 이슈 매핑
- P0: #172, P1: #173, P2: #174, P3: #175, P4: #176

## 다음 루프 지시

**P2 스트릭 로직 구현으로 진행하라.**
1. `packages/backend/src/lib/streak.ts` 신규:
   - `computeStreak(lastWakeupDate: string | null, todayDate: string, currentStreak: number)` → `{ newStreak: number, isNewDay: boolean, milestoneReached: number | null }`
   - 어제=streak+1, 오늘=변경없음, 2일+=리셋(1)
   - 마일스톤: 7/30/90 도달 시 해당 값 반환
2. `packages/backend/src/lib/xpRules.ts` — streak_bonus_7(100XP), streak_bonus_30(500XP), streak_bonus_90(2000XP) 이벤트 추가 (일일캡 면제)
3. typecheck 통과 확인

## 알려진 이슈
- [blocked] Perso API 404
- [blocked] ElevenLabs 통합 테스트
- FontFamily/fontForWeight 중복
