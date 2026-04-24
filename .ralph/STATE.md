# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P2 스트릭 로직 + XP 규칙 + 능력치 함수 구현 완료
- 현재 Phase: **P2 진행 중 — API 확장 대기**
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
- **P2 스트릭 로직**: `streak.ts` — computeStreak + MILESTONE_BONUS_XP 구현.
- **P2 XP 규칙**: streak_bonus_7/30/90 이벤트 + 일일캡 면제(isCapExempt) 추가.
- **P2 능력치**: `character.ts`에 CharacterStats 타입 + computeStats 함수 추가.

## 남은 리팩토링 목표

1. P0 Phase 1-B-2: fontWeight→fontFamily 마이그레이션 (낮은 우선순위)
2. P2: API 확장 (GET /characters/me에 streak/stats/achievements 추가, POST /characters/xp에 스트릭 통합) — **다음 작업**
3. P2: 프론트엔드 캐릭터 화면 강화
4. P3: R2 스토리지 + FCM 푸시
5. P5: 커플 뷰 개선

## GitHub 이슈 매핑
- P0: #172, P1: #173, P2: #174, P3: #175, P4: #176

## 다음 루프 지시

**P2 백엔드 API 확장으로 진행하라.**
1. `CharacterRow` 인터페이스에 `current_streak`, `longest_streak`, `last_wakeup_date` 필드 추가
2. `GET /characters/me` 응답에 streak, stats, achievements 필드 포함
3. `POST /characters/xp`에 `local_date` 파라미터 추가 → computeStreak 호출 → DB 업데이트 + 마일스톤 달성 시 streak_bonus 이벤트 자동 발동
4. `character_stats` 행도 함께 갱신 (alarm_completed 이벤트 시 diligence+1, consistency+1)
5. typecheck 통과 확인

## 알려진 이슈
- [blocked] Perso API 404
- [blocked] ElevenLabs 통합 테스트
- FontFamily/fontForWeight 중복
