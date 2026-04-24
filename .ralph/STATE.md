# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P3 배포 설정 정비 완료
- 현재 Phase: **P3 완료 — P4/P5 대기**
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
- **P2 API 확장**: GET /characters/me에 streak/stats/achievements 응답 추가, POST /characters/xp에 local_date+스트릭 통합+마일스톤 자동 발동+능력치 갱신 완료.
- **P2 프론트엔드**: 캐릭터 화면에 스트릭 뱃지(🔥), 능력치 바, 마일스톤 배지 추가. 홈 위젯에 스트릭 카운트 표시. i18n 키 17개 추가 (ko/en).
- **P2 나무 대사**: DIALOGUES 스테이지당 4→7개 확장 + STREAK_DIALOGUES 5계층 추가 + pickStreakAwareDialogue 함수.
- **P3 R2 스토리지**: R2VoiceStorage 구현 + wrangler.toml 바인딩 + voice.ts R2 우선 폴백 통합.
- **P3 FCM 푸시**: 마이그레이션 14(push_tokens) + fcm.ts(mock) + push.ts 라우트 + scheduled 통합 + 모바일 자동 등록.
- **P3 배포 설정**: wrangler.toml cron `*/5 * * * *` 추가.

## 남은 리팩토링 목표

1. P0 Phase 1-B-2: fontWeight→fontFamily 마이그레이션 (낮은 우선순위)
2. P4: 기획서 동기화 + 추가 정비
3. P5: 커플 뷰 개선 + UI 폴리시

## GitHub 이슈 매핑
- P0: #172, P1: #173, P2: #174, P3: #175, P4: #176

## 다음 루프 지시

**P0 Phase 1-B-2 (fontWeight→fontFamily 마이그레이션)로 진행하라.**
P3가 완료되었으므로, 낮은 우선순위로 미뤄둔 fontWeight→fontFamily 변환(28개 파일)을 진행.
1. 각 파일의 `fontWeight: 'bold'/'600'/'500'` → `fontFamily: FontFamily.bold/semibold/medium` 변환
2. 한 번에 최대 10개 파일만 변경 (메가 커밋 방지)
3. typecheck 통과 확인

## 알려진 이슈
- [blocked] Perso API 404
- [blocked] ElevenLabs 통합 테스트
- FontFamily/fontForWeight 중복
