# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P5 다크모드 인프라 구축 완료
- 현재 Phase: **P5 UI 폴리시 진행 중. 다음: 다크모드 화면별 마이그레이션 Batch 1**
- 전체 typecheck 통과

## 완료된 리팩토링

- **P0 Phase 1-A**: packages/web 전체 삭제 완료.
- **P0 Phase 1-B**: Pretendard 폰트 적용 완료.
- **P0 Phase 1-B-2**: 전체 앱 fontWeight→fontFamily 마이그레이션 완료 (29개 파일, 3배치).
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
- **P4 온보딩**: 4페이지 추가 (나무 캐릭터 소개), 캐릭터 자동 생성 prefetch, SafeAreaView, 접근성, 토큰 색상 통일.
- **P4 알람 정확도**: 반복 알람 categoryIdentifier 누락 수정, Dismiss 액션 핸들링 추가, 권한 체크 추가.
- **P4 오프라인 캐싱**: Voices 탭에 오프라인 캐싱 추가, 기존 알람/홈/라이브러리 캐싱 검증 완료.
- **P5 UI 폴리시 B1**: alarms/voices 하단 패딩 추가, voices/library 빈 상태 CTA, 홈 최근메시지 빈 상태.
- **P5 다크모드 인프라**: ThemeColorScheme 인터페이스, useTheme 훅, useAppStore darkMode persist, Settings 토글 연결, root/tabs layout 테마 적용.

## 남은 리팩토링 목표

1. P5: 다크모드 화면별 마이그레이션 (5개 탭 + 스택 화면 ~20개)
2. P5: 커플 뷰 개선 + 카드 스타일 일관성 + 알람 시간 설정 UI

## GitHub 이슈 매핑
- P0: #172, P1: #173, P2: #174, P3: #175, P4: #176

## 다음 루프 지시

**P5 다크모드 화면 마이그레이션 Batch 1로 진행하라.**
- 대상: `index.tsx`, `alarms.tsx`, `voices.tsx`, `people.tsx` (4개 탭 화면)
- 패턴: `useTheme()` → `createStyles(colors)` → `Colors.light.*` 제거 → 하드코딩 `#FFF` → `colors.surface`
- settings.tsx는 이미 완료

## 알려진 이슈
- [blocked] Perso API 404
- [blocked] ElevenLabs 통합 테스트
- FontFamily/fontForWeight 중복 (fontForWeight는 남아 있으나 현재 사용처 없음 — 추후 정리)
- 다크모드 미적용 화면 ~25개 (Colors.light 직접 참조 + 하드코딩 #FFF)
