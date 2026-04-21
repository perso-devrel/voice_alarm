# 📌 현재 상태 (마지막 업데이트: 2026-04-21 17:40)

- 진행 중 Phase: **10 (자율 개선 모드)**. **Phase 1~9 완료.**
- 완료 이슈: #15, #17, #19, #21, #23, #25, #27, #29, #31, #33, #35, #37, #39, #41, #43, #45, #47, #49, #51, #53, #55, #57, #59, #61, #63, #65, #67, #69, #71, #73, #75, #77, #79, #81, #83, #85, #87, #89, #91, #93, #95, #97, #99, #101, #103, #105, #107, #109, #111, #113, #115, #117, #119, #121 (54개). Phase 1~9 완료 + Phase 10 4건.
- 진행 중 이슈: 없음
- blocked 이슈: 없음
- blocked 이슈: 없음
- 루프 작업 브랜치: `develop_loop` (origin 푸시 완료)

---

## 루프 로그

## 2026-04-21 17:55 · Issue #121 · [Phase 10] 개발용 XP 지급 버튼 DEV 가드
- 브랜치: `feature/issue-121-dev-xp-guard`
- PR: #122 (merged)
- 변경 파일: 2개 (수정)
- 요약: Phase 10 자율 개선 #4 — PROGRESS.md 리스크 항목 해소. 웹 CharacterPage에 `import.meta.env.DEV` 가드, 모바일 character.tsx에 `__DEV__` 가드 추가하여 프로덕션 빌드에서 테스트용 XP 지급 섹션 비노출. tsc 0 에러.
- 다음: Phase 10 다음 개선 후보.
- 리스크: 없음.

---

## 2026-04-21 17:50 · Issue #119 · [Phase 10] rate limit 미들웨어 테스트
- 브랜치: `feature/issue-119-ratelimit-test`
- PR: #120 (merged)
- 변경 파일: 1개 (신규)
- 요약: Phase 10 자율 개선 #3 — `rateLimit.ts` 미들웨어에 전용 테스트 파일이 없었음. Hono 인스턴스에 미들웨어 장착 후 4건 검증: 정상 200 + X-RateLimit-* 헤더, 61회 429 + Retry-After, 다른 IP 독립 카운트, Remaining 감소. 백엔드 468→472 / 35 파일 그린.
- 다음: Phase 10 다음 개선 후보.
- 리스크: 없음.

---

## 2026-04-21 17:45 · Issue #117 · [Phase 10] UUID 검증 유틸 추출
- 브랜치: `feature/issue-117-uuid-validate-util`
- PR: #118 (merged)
- 변경 파일: 9개 (신규 2 + 수정 7)
- 요약: Phase 10 자율 개선 #2 — 7개 라우트(alarm/dub/friend/gift/library/tts/voice)에서 각각 로컬 정의되던 `UUID_RE` 정규식을 `src/lib/validate.ts` 로 추출. `isValidUUID` 헬퍼 함수 함께 제공. vitest 4건 추가(매치/불일치/함수). 백엔드 464→468 / 34 파일 그린, tsc 0 에러.
- 다음: Phase 10 다음 개선 후보 스캔.
- 리스크: 없음 (순수 리팩토링).

---

## 2026-04-21 17:40 · Issue #115 · [Phase 10] dub.ts 라우트 순서 버그 수정 + 테스트 7건
- 브랜치: `feature/issue-115-dub-tests`
- PR: #116 (merged)
- 변경 파일: 2개 (신규 1 + 수정 1)
- 요약: Phase 10 자율 개선 #1 — `GET /dub/jobs` 가 `GET /dub/:id` 뒤에 위치하여 `:id=jobs` 로 캡처되는 라우트 순서 버그 발견·수정. `/jobs` 를 `/:id` 앞으로 이동. `test/dub.test.ts` 신규 — vi.mock(db/perso) + vitest 7건(jobs 빈 목록/1건 + :id 400 UUID/404/ready/failed/uploading). 백엔드 457→464 / 33 파일 그린, tsc 0 에러.
- 다음: Phase 10 다음 개선 후보 스캔.
- 리스크: 없음.

---

## 2026-04-21 17:40 · Issue #113 · Phase 9 문서화 — README 4종 + QA 체크리스트
- 브랜치: `feature/issue-113-phase9-docs`
- PR: #114 (merged)
- 변경 파일: 5개 (신규 4 + 수정 1)
- 요약: Phase 9 #51~#55 — `packages/backend/README.md`(환경 변수, 마이그레이션, API 엔드포인트 개요), `packages/web/README.md`(기술 스택, 주요 화면), `apps/mobile/README.md`(탭 구조, 프로젝트 디렉토리 구조), 루트 `README.md`(mermaid 아키텍처 다이어그램 추가 — Client/Backend/Packages/External 4레이어 + 의존 관계), `docs/QA_CHECKLIST.md`(인증/음성/TTS/알람/이용권/가족/캐릭터/접근성/에러/온보딩 10영역 60+항목). **Phase 9 완료. Phase 1~9 모두 완료.**
- 다음: Phase 10 자율 개선 모드 진입.
- 리스크: 없음 (문서 PR).

---

## 2026-04-21 17:30 · Issue #111 · 웹 온보딩 튜토리얼 3-스텝
- 브랜치: `feature/issue-111-web-onboarding`
- PR: #112 (merged)
- 변경 파일: 5개 (신규 3 + 수정 2)
- 요약: Phase 8 #50 마지막 이슈. `packages/ui/src/onboarding.ts` 에 `ONBOARDING_STEPS` 3종(🎙️ 음성 등록 / 💌 매일 메시지 / ⏰ 알람으로 시작) + `isLastStep`/`clampStepIndex` 순수 함수 + `ONBOARDING_STORAGE_KEY` 상수. 웹 `OnboardingOverlay.tsx` — 모달(z-50 fixed, bg-black/50), 이모지+제목+설명 whitespace-pre-line, dot indicator(현재 스텝 w-6 확장), 건너뛰기/다음/시작하기 3 상태 전환, `localStorage` 기반 완료 저장(true 면 null 반환). `App.tsx` 에 `<OnboardingOverlay />` 추가(인증 후 표시). vitest ui +9건(STEPS 길이/필드 + isLastStep 3 + clampStepIndex 3 + 키 1) → ui 29→38 그린, tsc 0 에러. **Phase 8 완료.**
- 다음: Phase 9 #51 apps/backend/README.md.
- 리스크: 온보딩 콘텐츠가 한국어 고정 — i18n 통합은 후속. 모바일 온보딩과 웹 온보딩의 문구가 일부 다름(동기화는 Phase 10).

---

## 2026-04-21 17:25 · Issue #109 · 공용 StateView 컴포넌트
- 브랜치: `feature/issue-109-state-view`
- PR: #110 (merged)
- 변경 파일: 9개 (신규 7 + 수정 2)
- 요약: Phase 8 #49 — loading/empty/error 3-in-1 상태 UI 통일. `packages/ui/src/stateView.ts` 에 `resolveStateView` 순수 함수(variant + overrides → {emoji, title, subtitle} 기본값 합성). 웹 `StateView.tsx`(Tailwind, spinner/emoji/action, role=alert|status, aria-busy). 모바일 `StateView.tsx`(ActivityIndicator, accessibilityRole, minHeight 44, Pressable action). 모바일은 `src/lib/stateView.ts` 로컬 복사(apps/mobile 은 packages/* 워크스페이스 밖). vitest ui +6건 + jest mobile +5건 → ui 23→29 / mobile 129→134 / web 98 그린, tsc 0 에러.
- 다음: Phase 8 #50 온보딩 튜토리얼.
- 리스크: 기존 화면의 인라인 상태 UI를 StateView로 교체하는 것은 Phase 10 후보. resolveStateView의 기본 문구가 한국어 고정 — i18n 통합은 후속.

---

## 2026-04-21 17:20 · Issue #107 · 에러 경계(ErrorBoundary) 추가
- 브랜치: `feature/issue-107-error-boundary`
- PR: #108 (merged)
- 변경 파일: 4개 (신규 3 + 수정 1)
- 요약: Phase 8 #48 — 모바일 `ErrorBoundary` 컴포넌트 신규(에러 이모지 + 메시지 + 다시 시도 버튼, `accessibilityRole="alert"`, minHeight 44 터치 타겟) + `_layout.tsx` 최외곽 래핑. 웹은 기존 `ErrorBoundary` 활용 중 — getDerivedStateFromError 테스트만 추가. 백엔드는 기존 `onError` 구조화 JSON 핸들러로 충분. jest 모바일 +2건(getDerivedStateFromError + initial state) / vitest 웹 +2건 → 모바일 127→129 / 웹 96→98 그린, tsc 0 에러.
- 다음: Phase 8 #49 로딩·빈 상태·에러 상태 UI 일관성.
- 리스크: Sentry 등 외부 에러 추적 서비스 미연동. componentDidCatch 에서 로그 전송은 후속 이슈.

---

## 2026-04-21 17:15 · Issue #105 · 접근성 유틸 + 터치 타겟 보강
- 브랜치: `feature/issue-105-a11y-basics`
- PR: #106 (merged)
- 변경 파일: 4개 (신규 2 + 수정 2)
- 요약: Phase 8 #47 — `packages/ui/src/a11y.ts` 에 WCAG 2.1 AA 색 대비 계산 유틸(`relativeLuminance`, `contrastRatio`, `meetsAA`) + 상수(`MIN_TOUCH_TARGET=44`, `WCAG_AA_NORMAL=4.5`, `WCAG_AA_LARGE=3.0`). sRGB→linear→relative luminance→대비비 계산. `index.ts` re-export. vitest 13건(luminance black=0/white=1 + ratio black-white=21/same=1/commutative + meetsAA pass/fail/largeText + constants 2 + token audit 3). 디자인 토큰 감사: coral(#FF7F6B) on white는 2.7:1로 AA 미달 → 장식용 한정 사용 문서화. 모바일 character 화면 devButton에 `minHeight:44` 적용. ui 10→23건 / web 96 / mobile 127 그린, tsc 0 에러.
- 다음: Phase 8 #48 에러 경계 & 전역 에러 핸들러 — React ErrorBoundary(웹), RN ErrorBoundary(모바일), 백엔드 글로벌 에러 핸들링 미들웨어.
- 리스크: 전체 모바일 버튼 44px 보강은 Phase 10 범위. `meetsAA`는 hex 컬러만 지원 — rgba/hsl 은 미지원.

---

## 2026-04-21 17:10 · Issue #103 · 공용 디자인 토큰 패키지
- 브랜치: `feature/issue-103-design-tokens`
- PR: #104 (merged)
- 변경 파일: 6개 (신규 5 + package-lock)
- 요약: Phase 8 #46 — `packages/ui` 워크스페이스 (`@voice-alarm/ui`) 신규. `tokens.ts`에 ColorPalette(19색 hex), LightColors/DarkColors(16 시맨틱 키 일치), Spacing(xs~xxl 6단계), BorderRadius(sm~full 5단계), FontSize(xs~hero 7단계), FontWeight(normal~bold 4단계), FontFamily(system/mono), `getColors(mode)` 헬퍼. `index.ts` 에서 전부 re-export + 타입 export. vitest 10건(hex 검증·키 일치·모드 분기·spacing 오름차순·borderRadius full·fontSize 오름차순·fontWeight bold) → ui 10건 / 전체 tsc 0 에러.
- 다음: Phase 8 #47 접근성 기본 체크 — 스크린리더 aria, 색 대비, 터치 타겟 44px 이상.
- 리스크: 웹/모바일 기존 하드코딩 색상을 `@voice-alarm/ui` import로 교체하는 것은 별도 리팩토링 이슈(Phase 10 후보).

---

## 2026-04-21 17:05 · Issue #101 · 성장 단계 전환 애니메이션
- 브랜치: `feature/issue-101-stage-transition-anim`
- PR: #102 (merged)
- 변경 파일: 7개 (수정)
- 요약: Phase 7 #45 마지막 이슈. seed→sprout→tree→bloom 전환 시 심플한 scale+fade 애니메이션. `stageIndex`/`shouldShowStageTransition` 순수 함수를 웹/모바일 양쪽 `character.ts`에 추가. 웹은 `@keyframes stage-pop`(0→scale 0.3/opacity 0 → 50% scale 1.2/opacity 1 → 100% scale 1) + `prevStageRef`/`stageAnimating` 상태로 CSS 전환 트리거. 모바일은 `Animated.spring`(scale 0.3→1.2→1) + `Animated.timing`(opacity 0→1, 200ms)의 `Animated.sequence` 조합, `useNativeDriver: true`. vitest 웹 +5건(stageIndex 2 + shouldShowStageTransition 4) + jest 모바일 +6건(stageIndex 2 + shouldShowStageTransition 4) → 웹 91→96 / 모바일 121→127 그린, tsc 0 에러. **Phase 7 완료.**
- 다음: Phase 8 #46 공용 디자인 토큰 — `packages/ui/tokens.ts` 에 색/타이포/spacing 통합, 웹·앱에서 참조.
- 리스크: 애니메이션은 XP 지급 후 stage 변경 시에만 트리거 — 최초 로딩 시에는 발생하지 않음. Lottie/스프라이트 기반 복잡한 전환은 Phase 10 후보.

---

## 2026-04-21 16:50 · Issue #99 · 모바일 캐릭터 화면 + 🌱 탭 등록
- 브랜치: `feature/issue-99-mobile-character-page`
- PR: #100 (merged)
- 변경 파일: 7개 (신규 3 + 수정 4)
- 요약: Phase 7 #44 — 웹(#97)과 동일 계약의 모바일 캐릭터 탭. `apps/mobile/src/lib/character.ts` 순수 함수 7종(normalizeStage, stageToEmoji, stageToLabel, listDialogues, pickRandomDialogue, formatProgress, progressBarWidthPct) — 이모지·라벨·대사 매핑 웹과 완전 일치. `services/api.ts`에 `CharacterPayload`/`CharacterProgress`/`CharacterResponse`/`CharacterGrantResponse`/`XpEvent` 타입 + `getCharacterMe`/`grantCharacterXp` 두 fetcher 추가. `app/(tabs)/character.tsx` 신규 — SafeAreaView+ScrollView, 큰 이모지(스테이지) + Lv·라벨 뱃지 + Pressable 탭 시 dialogueSeed 기반 결정성 rng 대사 전환, XP 게이지 바(accessibilityRole=progressbar + accessibilityValue min/max/now), 총 XP/애정도/오늘 획득 3-column, 개발용 3개 버튼(alarm_completed/alarm_snoozed/family_alarm_received) → grantMutation → 성공 시 알림 텍스트. `_layout.tsx`에 🌱 character 탭 등록. i18n ko `내 캐릭터` / en `Character`. jest 18건(normalizeStage 7 + emoji/label 6 + listDialogues 1 + pickRandom 4 + format 4 + bar 4) → 모바일 103→121 / 11 파일 그린, tsc 0 에러.
- 다음: Phase 7 #45 성장 단계 전환 애니메이션 — seed→sprout→tree→bloom 전환 시 심플 애니메이션(React Native Animated 또는 Reanimated). 웹은 CSS transition, 모바일은 Animated.timing 기반 scale+opacity.
- 리스크: 개발용 XP 지급 버튼이 항상 노출됨 — Phase 8에서 `__DEV__` 기반 숨김 처리. 이모지 기반 아바타는 MVP — 커스텀 일러스트/스프라이트 전환은 Phase 10 후보. 웹과 대사·이모지 매핑은 일치하지만 두 곳에서 유지되므로 Phase 10에서 `packages/shared`로 추출 고려.

---

## 2026-04-21 16:35 · Issue #97 · 웹 캐릭터 화면 + XP 지급 테스트
- 브랜치: `feature/issue-97-web-character-page`
- PR: #98 (merged)
- 변경 파일: 5개 (신규 3 + 수정 2)
- 요약: Phase 7 #43 — 백엔드 #40~#42 를 웹 대시보드로 노출. `packages/web/src/lib/character.ts` 순수 함수 — `CharacterStage` 유니온, `STAGE_EMOJI`(seed🌱 sprout🌿 tree🌳 bloom🌸) / `STAGE_LABEL`(씨앗/새싹/나무/꽃), `DIALOGUES` 스테이지별 4대사, `normalizeStage`(유효값 whitelist + seed 폴백), `pickRandomDialogue(stage, rng=Math.random)` 결정성 주입 가능(NaN 방어/클램프 `[0,0.999999]`), `formatProgress(p)` "XP 120 / 400 (30%)" + null·NaN·음수 방어, `progressBarWidthPct` 0..100 클램프. `services/api.ts` 에 `XpEvent`/`CharacterPayload`/`CharacterResponse`/`CharacterGrantResponse` 타입 + `getCharacterMe`/`grantCharacterXp` 두 fetcher 추가. `pages/CharacterPage.tsx` — TanStack Query `['character-me']`, 큰 이모지(스테이지) + Lv·라벨 뱃지 + 탭 시 dialogueSeed 증가로 결정성 rng 기반 랜덤 대사 전환(role=button, Enter/Space 지원), XP 게이지 바 `role=progressbar`·aria-valuenow, 총 XP/애정도/오늘 획득(daily_xp/200) 3-column 요약, 개발용 3개 버튼(alarm_completed/alarm_snoozed/family_alarm_received) → `grantMutation` → 성공 시 "+N XP · +M 애정도 (일일 캡 도달)?" 알림 + `invalidateQueries`. `App.tsx` 에 lazy `CharacterPage` + Page 유니온 'character' + NAV_ITEMS 🌱 내 캐릭터 + renderPage case. vitest 15건(normalize 8 + 이모지·라벨 2 + 대사 리스트 1 + 결정성 4 + format 4 + bar 2 — listDialogues 포함) → 웹 76→91 / 10 파일 그린, tsc 0 에러(3 패키지).
- 다음: Phase 7 #44 모바일 캐릭터 화면 — 웹과 동일 계약으로 `apps/mobile/src/lib/character.ts` 이식(이모지·라벨·대사·pickRandomDialogue·formatProgress) + `services/api.ts` 에 `getCharacterMe`/`grantCharacterXp` 추가 + `app/(tabs)/character.tsx` 신규 탭(Pressable → 대사 전환, aria progressbar 대응 `accessibilityRole="progressbar"` + `accessibilityValue`) + `_layout.tsx` 탭 등록(🌱 아이콘) + jest 테스트. 웹과 대사·이모지 매핑 정확히 일치시켜 공용 스냅샷성 유지.
- 리스크: 개발용 XP 지급 버튼이 런타임에 항상 노출됨 — Phase 8 폴리시에서 `import.meta.env.DEV` 또는 role 기반 숨김 처리 예정. 이모지 기반 아바타는 MVP 범위 — 커스텀 일러스트/스프라이트 전환은 Phase 10 후보. `pickRandomDialogue` 의 rng 주입은 테스트 결정성 용이지만 UI 는 `dialogueSeed` 기반 LCG 유사 계산으로 깜박임 시 순서가 재현 가능해 UX 상 "진짜 랜덤" 감 부족 — Phase 8 에서 `Math.random()` 으로 전환하거나 seed 를 시간 기반으로 교체 검토.

---

## 2026-04-21 16:28 · Issue #95 · XP 지급 API (POST /characters/xp)
- 브랜치: `feature/issue-95-xp-grant-api`
- PR: #96 (merged)
- 변경 파일: 4개 (수정 3 + 신규 1)
- 요약: Phase 7 #42 — 이벤트 기반 XP/애정도 지급 서버 엔드포인트. 마이그레이션 #12 `character-xp-logs` — `characters.daily_xp INTEGER NOT NULL DEFAULT 0`, `characters.daily_xp_reset_at TEXT` 컬럼 추가 + `character_xp_logs` 테이블(id, character_id FK, event, client_nonce, granted_xp, affection_delta, capped, created_at) + `(character_id, client_nonce)` 유니크 partial index(nonce IS NOT NULL 일 때만). `POST /api/characters/xp { event, client_nonce? }` — `isXpEvent`(#93) 검증 400, user resolve 404, `client_nonce` 중복 시 기존 로그 재응답(200 duplicated=true), 날짜 바뀌면 daily_xp=0 리셋 후 `computeGrant`(#93) 호출, `characters` UPDATE + `character_xp_logs` INSERT, 응답 201 `{character, progress, grant:{event, granted_xp, affection, capped, remaining_cap, duplicated}}`. `routes/character.ts` 를 `lib/character.ts` + `lib/xpRules.ts` 양쪽에 의존하도록 확장 — `CharacterRow` 에 daily_xp/reset_at 필드 추가, `loadOrCreateCharacter` 헬퍼 분리, `serializeCharacter` 로 xp 기준 level/stage 재계산 + DB 에도 동기화. vitest 9건(400/404/정상/캡초과/날짜리셋/멱등중복/자동생성/dismissed 로그/마이그레이션 #12 구조) → 백엔드 448→457 / 32 파일 그린, tsc 0 에러.
- 다음: Phase 7 #43 웹 캐릭터 화면 — `packages/web/src/pages/CharacterPage.tsx` + `services/api.ts` 에 `getCharacterMe`/`grantXp` + 순수 함수 헬퍼(`buildCharacterAvatar` 스테이지→이모지). 탭하면 정해진 대사 랜덤 출력, XP 게이지 바, 레벨/스테이지 뱃지. App.tsx 라우팅 추가.
- 리스크: libsql 웹 클라이언트에 수동 트랜잭션 지원이 제한되어 UPDATE→INSERT 순차 실행 — 중간 장애 시 XP 만 올라가고 로그 누락 가능. 실제로는 rollback 패턴 or Durable Object 경로 검토 후속 이슈. `friend_invited` 이벤트는 아직 호출부 없음 (#32 플로우 연결은 별도). `daily_xp_reset_at` 는 서버 UTC 기준 — 사용자 타임존 보정은 Phase 10 개선 후보.

---

## 2026-04-21 16:20 · Issue #93 · 경험치 규칙 문서 + 순수 함수
- 브랜치: `feature/issue-93-xp-rules`
- PR: #94 (merged)
- 변경 파일: 3개 (신규)
- 요약: Phase 7 #41 — 어떤 행동이 몇 XP 를 주는지 한 곳에서 결정. `docs/XP_RULES.md` 한국어 문서에 이벤트→XP/애정도 매핑(정상 완료 30/2, 스누즈 5/0, 강제 종료 0/0, 가족 알람 수신 10/3, 친구 초대 50/5) + 일일 캡 200 + 설계 근거(스누즈 파밍 차단 비율, 가족 알람 XP 는 낮지만 애정도 는 높게, 친구 초대는 1회성 부스터) + 엣지 케이스(earned<=0/NaN/음수 already/cap=0) 정리. `packages/backend/src/lib/xpRules.ts` — `XpEvent` 유니온 5종, `DAILY_XP_CAP=200`, `computeXpForEvent`·`computeAffectionForEvent`·`isXpEvent` 런타임 가드, `applyDailyXpCap(earned, already, cap?)` → `{grantedXp, capped, remainingCap}`, `computeGrant` 단일 진입점(애정도는 캡 영향 받지 않음). vitest 19건(매핑 5 + 가드 2 + 캡 8 + grant 4) → 백엔드 429→448 / 31 파일 그린, tsc 0 에러.
- 다음: Phase 7 #42 XP 지급 API — `POST /api/characters/xp { event, client_nonce? }` 신설. `characters.daily_xp` / `daily_xp_reset_at` 컬럼 추가하거나 `character_xp_logs` 테이블로 지급 이력 관리. `computeGrant` 호출 후 트랜잭션으로 `xp += grantedXp, affection += affection` 업데이트 + `level`/`stage` DB 재계산. `(user_id, client_nonce)` 유니크 인덱스로 idempotent 보장.
- 리스크: 문서와 코드의 수치가 손으로 동기화됨 — 향후 값 변경 시 두 곳 모두 수정해야 함. 지급 이력 테이블 스키마는 아직 미결정(#42 에서 확정). `alarm_snoozed` 5 XP 가 남용되면 Phase 10 에서 0 또는 2 로 강등 고려.

---

## 2026-04-21 16:12 · Issue #91 · 캐릭터 모델 + XP/성장단계 헬퍼
- 브랜치: `feature/issue-91-character-model`
- PR: #92 (merged)
- 변경 파일: 7개 (신규 4 + 수정 3)
- 요약: Phase 7 게이미피케이션 첫 이슈. 마이그레이션 #11 `characters` 테이블 — `(id, user_id UNIQUE FK users(id), name DEFAULT '내 캐릭터', level=1, xp=0, affection=0, stage CHECK IN ('seed','sprout','tree','bloom') DEFAULT 'seed', created_at, updated_at)` + `idx_characters_user` 유니크 인덱스(1 사용자 1 캐릭터). `lib/character.ts` 순수 함수 3종 — `xpThresholdForLevel(n)=100*(n-1)^2` (L1→0, L2→100, L3→400, L5→1600), `computeLevelFromXp(xp)=1+floor(sqrt(xp/100))`, `computeStageFromLevel` (1-2 seed, 3-5 sprout, 6-9 tree, 10+ bloom) + `computeStageFromXp` 복합 경로. `routes/character.ts` `GET /api/characters/me` — 사용자 PK 없으면 404, 캐릭터 없으면 기본값 INSERT 후 반환, **저장된 level/stage 를 신뢰하지 않고 서버가 xp 기준으로 재계산**하여 응답(클라이언트 오염 방어). `progress` 필드로 xp_into_level / xp_to_next_level / progress_ratio 제공. vitest 17건 추가 (헬퍼 13 + 라우트 5, 마이그레이션 #11 검증 1 보강) → 백엔드 412→429 / 30 파일 그린, tsc 0 에러.
- 다음: Phase 7 #41 경험치 규칙 설계 문서 — `docs/XP_RULES.md` 에 알람 정상 종료 +30 XP / 스누즈 +5 XP / 강제 종료 0 XP / 일일 최대 200 XP 캡 등 규칙 정리. 근거·예시·애정도 증가 조건 포함.
- 리스크: XP 지급 API(`POST /characters/xp`) 는 #42 에서 구현 — 현재는 read-only 경로만 제공. 웹/모바일 UI 는 #43/#44 에서. `characters.level`·`stage` 컬럼은 저장은 하지만 응답 시 재계산되므로 DB 값과 응답 값 불일치 가능 — `POST xp` 구현 시 UPDATE 로 DB 값도 동기화 예정. 1 사용자 복수 캐릭터·나무 종류 분기 미지원(MVP 범위).

---

## 2026-04-21 16:05 · Issue #89 · 가족 알람 수신 뱃지 + sender 메타 노출
- 브랜치: `feature/issue-89-family-alarm-receive-badge`
- PR: #90 (merged)
- 변경 파일: 10개 (신규 4 + 수정 6)
- 요약: 백엔드 `normalizeAlarmRow(row, viewerUserId?)` 리팩터링 — `category ∈ {family, family-voice}` 로 `is_family_alarm` 판정, `row.user_id !== viewerUserId` 로 `is_received_family_alarm` 서버 계산, `creator_email`/`creator_name`/`category` SELECT 후 sender_user_id·sender_name·sender_email 노출. GET 리스트·GET 단건·PATCH 3곳 호출부에 `c.get('userId')` 전달. 웹/모바일 `src/lib/familyAlarmLabel.ts` 동일 계약의 순수 함수 2종 — `isReceivedFamilyAlarm`(서버 플래그 우선, 폴백 로직), `buildFamilyAlarmLabel`(name→email→'가족' fallback + 💌 prefix). `packages/web/src/pages/AlarmsPage.tsx` 카드 행과 `apps/mobile/app/(tabs)/alarms.tsx` 메타 영역에 primary-tinted pill 뱃지 렌더. `Alarm` 타입에 sender 필드 5개 추가(웹·모바일). 테스트: backend 3건(family/non-family/family-voice) + 웹 vitest 12건 + 모바일 jest 12건 → backend 409→412, web 64→76, mobile 91→103 그린, 3개 패키지 tsc 0 에러.
- 다음: Phase 7 #40 캐릭터 모델 + XP 규칙 — `characters` 테이블(id, user_id, level, xp, stage) 스키마 + 행동별 XP 획득 규칙(알람 생성/수신자 피드백/친구 초대) 정의 + `POST /api/characters/xp { delta, reason }` 부여 API. 레벨업 시 stage 자동 증가.
- 리스크: 백엔드가 뱃지 렌더 판단을 가지게 되어 `is_received_family_alarm=true` 인데 실제 category 가 family 가 아닌 엣지 케이스가 없도록 DB 정합성 유지 필요(현재는 INSERT 측이 category 를 family/family-voice 로만 내려줌). 과거 응답 호환을 위한 클라이언트 fallback(`sender_user_id !== selfUserId`) 은 `selfUserId` 미주입 시 false 반환 — 리스트/단건 API 가 `viewerUserId` 를 항상 받으므로 실질 영향 없음. 발신자 프로필 사진은 미노출 — 후속 이슈(#44/#45) 에서 아바타 연계 예정.

---

## 2026-04-21 15:50 · Issue #87 · 모바일 가족 알람 편집 화면
- 브랜치: `feature/issue-87-mobile-family-alarms`
- PR: #88 (merged)
- 변경 파일: 7개 (신규 3 + 수정 4)
- 요약: 웹(#85) 과 동일한 순수 헬퍼 계약을 React Native(Expo) 로 이식. `apps/mobile/src/lib/familyAlarmForm.ts` — `filterFamilyAlarmRecipients`/`validateFamilyAlarmForm`/`buildMemberDisplayName` 3종. `apps/mobile/app/(tabs)/family.tsx` 신규 탭 스크린 — 3-state UI(로딩/그룹 없음/그룹+폼), 수신자 칩 선택(owner·소유자 뱃지), 기상 시간 TextInput(HH:mm), 메시지 textarea(500자 카운터), 반복 요일 7개 Pill 토글, TanStack Query mutation 으로 `createFamilyAlarmText` 호출, 에러/성공 Text 인라인 표시, SafeAreaView + ScrollView. `services/api.ts` 에 `FamilyGroupMember`/`FamilyGroupCurrent`/`FamilyAlarmCreatePayload`/`FamilyAlarmCreateResponse` 타입 + 두 엔드포인트 추가. `(tabs)/_layout.tsx` 에 `family` 탭 등록(아이콘 👨‍👩‍👧, home 🏠 와 구분). i18n ko/en 에 `tab.family` 추가. jest familyAlarmForm 17건 신규 → 모바일 74→91 / 9 파일 그린, tsc 0 에러. 백엔드·웹 suite 변경 없이 409·64 유지.
- 다음: Phase 6 #39 가족 알람 수신 표시 — 수신자 쪽 홈/알람 탭에서 "가족이 보낸 알람" 구분 표시(예: 발신자 뱃지/아이콘 + 메시지 출처 라벨). 기존 `getAlarms` 응답에 `sender_user_id`·`sender_name` 노출 필드 추가 여부 판단 + 모바일·웹 공통 UI.
- 리스크: 모바일 폼은 현재 텍스트 모드만 — voice 모드(#83 백엔드) UI 는 미구현(후속 이슈에서 음성 업로드 + 더빙 선택 추가). React Native `TextInput` 의 HH:mm 가드는 정규식으로만 방어(네이티브 time picker 미연동) — Phase 8 폴리시 단계에서 개선 예정. `getUserProfile` 반환 타입이 모바일/웹 간 다름(모바일 flat, 웹 wrapped) — 공통 타입 정리는 Phase 8.

---

## 2026-04-21 15:35 · Issue #85 · 웹 가족 알람 편집 화면
- 브랜치: `feature/issue-85-web-family-alarms`
- PR: #86 (merged)
- 변경 파일: 7개 (신규 3 + 수정 4)
- 요약: `packages/web/src/lib/familyAlarmForm.ts` 순수 함수 3종 — `filterFamilyAlarmRecipients`(self·비허용 제외 + owner 우선 정렬), `validateFamilyAlarmForm`(wake_at HH:mm · 메시지 trim/500자 · repeatDays 중복·범위 밖 제거+정렬 · voice_profile_id 선택), `buildMemberDisplayName`(name→email→'이름 미지정'). `FamilyAlarmsPage.tsx` 3 상태 UI — 로딩/그룹 없음/그룹+폼, 멤버 카드(소유자·멤버 + 알람 허용/거부 뱃지), 수신자 select + 시간 + 메시지(500자 카운터) + 반복요일 토글, react-query mutation 성공/에러 메시지. `services/api.ts` 에 `getFamilyGroupCurrent`·`createFamilyAlarmText`·`FamilyGroupMember`(allow_family_alarms 포함)·`FamilyAlarmCreatePayload` 타입 추가. `App.tsx` '가족 알람' 🏠 탭 라우팅. **백엔드 보조 변경**: `GET /api/family/groups/current` members 응답에 `u.allow_family_alarms` SELECT 추가 + `Number(...) === 1` 로 boolean 정규화 (기존 테스트도 함께 업데이트). vitest familyAlarmForm 17건 + backend 기존 1건 업데이트 → 웹 47→64 / backend 409 파일 그린, tsc 0 에러.
- 다음: Phase 6 #38 모바일 가족 알람 편집 화면 — React Native(Expo) 에 동일한 순수 헬퍼 이식(packages/web 과 계약 일치 보장) + `FamilyAlarmsScreen.tsx` + services 추가 + `react-native-picker/picker` 또는 Modal select.
- 리스크: voice 모드 UI 미구현(추후 `FamilyAlarmsPage` 에 탭 추가). 수신자 voice_profile 부재 시 pre-check 미구현(서버 400 만 노출). 초대/탈퇴/양도 UI 분리 필요. 웹에서 `getUserProfile` 반환이 `any` — 타입 narrowing 은 후속 이슈에서.

---

## 2026-04-21 15:28 · Issue #83 · 가족 알람 추가 API (voice 모드)
- 브랜치: `feature/issue-83-family-alarm-voice`
- PR: #84 (merged)
- 변경 파일: 2개 (수정)
- 요약: `POST /api/family/alarms/voice { recipient_user_id, wake_at, voice_upload_id, label?, dub_target_language?, repeat_days? }` 신규. 검증 체인은 text 모드와 동일하되 voice_upload 소유권(송신자 PK 일치) 검증 추가 + `dub_target_language ∈ {ko,en,ja,zh}` 화이트리스트. 더빙 경로 — `dub_jobs` INSERT(user_id=송신자 google_id, target_language, status='processing', result_message_id=신규 message.id) + `messages.audio_url=NULL`. 원본 경로 — `messages.audio_url = voice_uploads.object_key` 로 즉시 재생 가능. `messages.category='family-voice'` + `alarms.mode='sound-only'` 로 text 모드와 분리. label 기본값 `'가족이 보낸 음성'`, 200자 제한. `// TODO: real perso.ai/elevenlabs integration` 주석 — 실제 더빙 변환은 기존 `/api/dub` 경로에서 처리. vitest 11건 추가 (정상 기본/라벨/더빙 3 + 400×5 + 403×2 + 포맷) → 백엔드 398→409 / 28 파일 그린, tsc 0 에러.
- 다음: Phase 6 #37 웹 가족 알람 편집 화면 — 그룹 멤버 선택 + 시간/메시지/반복요일 + voice 모드 업로드 + 더빙 언어 선택 + 수신자 `allow_family_alarms` 뱃지 노출. `packages/web/src/pages/FamilyAlarmsPage.tsx` 와 API 클라이언트 함수.
- 리스크: 더빙 완료 콜백/폴링 미구현 — `dub_jobs.status` 는 'processing' 에 멈춰있음. 실제 오디오 파일은 object_key 가 public URL 이 아닌 경우 서명 URL 변환 필요(재생 경로에서 래핑 예정). 수신자 재생 UX (#38/#39) 범위 밖. 동일 시간 중복 예약 가드 없음.

---

## 2026-04-21 15:22 · Issue #81 · 가족 알람 추가 API (text 모드)
- 브랜치: `feature/issue-81-family-alarm-text`
- PR: #82 (merged)
- 변경 파일: 2개 (수정)
- 요약: `POST /api/family/alarms { recipient_user_id, wake_at(HH:mm), message_text(1..500), repeat_days?, voice_profile_id? }` 신규. 검증 체인 — 필수필드/포맷(400) → 송신자 PK resolve → self-send 400 → 송신자 그룹 소속 403 → 같은 그룹 수신자 403 → 수신자 존재 404 → `allow_family_alarms=1` 403 → voice_profile 소유권(명시 시) 또는 수신자의 최근 profile 자동 매핑(없으면 400). DB 쓰기: `messages` INSERT(user_id=수신자 PK, voice_profile_id, category='family', audio_url=NULL) + `alarms` INSERT(user_id=송신자 google_id, target_user_id=수신자 google_id, mode='tts', repeat_days JSON). 응답 201 + `{alarm, message}`. `// TODO: real perso.ai/elevenlabs integration` 주석. vitest 12건 추가 (정상 자동/명시 2 + 403×3 + 404 + 400×6) → 백엔드 386→398 / 28 파일 그린, tsc 0 에러.
- 다음: Phase 6 #36 가족 알람 추가 API (voice 모드) — 음성 파일 업로드 후 원본 재생 또는 다국어 더빙(mock) 선택. `/api/family/alarms/voice` multipart 또는 `voice_file_id` 참조. 수신자 허용 체크 동일.
- 리스크: 실제 TTS 합성은 아직 mock (audio_url=NULL). 알람 실행 시 `/api/tts` 경로에서 채워야 함 — 스케줄러 연계는 후속 이슈. 동일 수신자·동일 시간 중복 생성 가드 없음 — UX 단에서 방어 예정(#37/#38).

---

## 2026-04-21 15:15 · Issue #79 · 가족 허용 설정 컬럼 + PATCH /user/me 토글
- 브랜치: `feature/issue-79-allow-family-alarms`
- PR: #80 (merged)
- 변경 파일: 4개 (수정)
- 요약: 마이그레이션 #10 `user-allow-family-alarms` — `ALTER TABLE users ADD COLUMN allow_family_alarms INTEGER NOT NULL DEFAULT 0` (기본 false). `GET /user/me` 응답에서 `allow_family_alarms` 를 `Number(raw) === 1` 로 boolean 직렬화. `PATCH /user/me { allow_family_alarms }` 신규 — `toBoolFlag` 헬퍼로 true/false/1/0/'1'/'0'/'true'/'false' 허용, 필드 누락/잘못된 타입 400, 사용자 없음 404. 다른 필드 확장을 위해 플랜 경로(`PATCH /user/plan`)와 분리. vitest 마이그레이션 #10 1건 + GET 직렬화 1건 + PATCH happy/invalid/404 5건 추가 → 백엔드 379→386 / 28 파일 그린, tsc 에러 없음.
- 다음: Phase 6 #35 가족 알람 추가 API (text 모드) — `POST /family/alarms { recipient_user_id, wake_at, message_text, repeat_days }` 가 발신자·수신자 모두 family subscription active + 수신자 `allow_family_alarms=1` 검증(403) 후 `alarms` 테이블에 `sender_user_id` 세팅하고 INSERT. vitest: 정상 + 403(수신자 거부) + 403(발신자 플랜 아님) + 404(수신자 없음) + 400(양식).
- 리스크: 현재 `allow_family_alarms=0` 이어도 기존에 수신한 알람은 그대로 재생 — 토글 후 기존 예약 알람 처리 정책은 #35 이후에 합의. 모바일/웹 설정 UI(Toggle) 미구현 — 별도 이슈(#38/#37) 에서 다룸.

---

## 2026-04-21 15:11 · Issue #77 · 가족 플랜 참여/탈퇴 + 소유자 권한 양도
- 브랜치: `feature/issue-77-family-leave-transfer`
- PR: #78 (merged)
- 변경 파일: 2개 (수정)
- 요약: `GET /family/groups/current` — 내 그룹 + 멤버 목록(owner 우선 정렬, email/name/picture 포함) + role. `POST /groups/:id/leave` — member 탈퇴 (owner 면 409). `POST /groups/:id/transfer-ownership { target_user_id }` — 검증(target 필수/self 금지/owner 본인/target 멤버) 후 2-step UPDATE: 기존 owner → member 강등 후 target → owner 승격 → plan_groups.owner_user_id 갱신. 중간 owner 0 허용, owner 2 금지. `DELETE /groups/:id/members/:uid` — owner 전용, 자기 자신/대상 owner 거부. vitest 14건 추가 (current 2 + leave 3 + transfer 5 + remove 4) → 백엔드 365→379 / 28 파일 그린, tsc 0 에러. **Phase 5 완료.**
- 다음: Phase 6 #34 가족 허용 설정 — `users.allow_family_alarms` boolean 컬럼 추가(마이그레이션 #10, 기본 0/false) + `PATCH /user/me` 에 토글 + `/family/alarms` 엔드포인트에서 403 게이트.
- 리스크: 양도 중간 장애 시 owner 0명 고착 가능 — admin 복구 후속. 그룹 해체(`DELETE /family/groups/:id`) 는 별도 이슈 예정. 가족 알람(Phase 6)과 함께 멤버 제거·탈퇴 시 기존 예약 알람 처리 정책 결정 필요.

---

## 2026-04-21 15:04 · Issue #75 · 가족 플랜 초대 코드 + 딥링크 하이브리드
- 브랜치: `feature/issue-75-family-plan-invites`
- PR: #76 (merged)
- 변경 파일: 8개 (신규 5 + 수정 3)
- 요약: TASK.md ⚠️ 모호 지점 해소 — 3가지 초대 방식 비교(`docs/INVITE_METHOD_COMPARISON.md`) 후 **초대 코드(6자리 숫자, 10분 만료, 일회용) + 딥링크 하이브리드** 채택. 마이그레이션 #9 `plan_group_invites` (code UNIQUE / status `pending|used|revoked|expired` / expires_at / used_by_user_id) + 인덱스 3종. `lib/invites.ts` 순수 함수 6종(crypto.getRandomValues 기반 생성, 포맷 검증, 딥링크/웹URL 빌더, TTL 계산). `routes/family.ts` 4 엔드포인트 — `POST /invites`(plan_group_id 선택적·owner 확인·정원 pre-check·딥링크 동반), `GET /invites`, `POST /invites/:code/accept`(포맷/상태/만료/자기발급/이미멤버/정원 6단 검증 + 만료 시 자동 expired 전환), `POST /invites/:code/revoke`(발급자·pending 한정). `index.ts` 에 `/api/family` 라우팅. vitest +26건 → 백엔드 339→365 / 28 파일 그린, tsc 0 에러.
- 다음: Phase 5 #33 참여/탈퇴·소유자 권한 양도 — 멤버 자진 탈퇴 엔드포인트 + owner 양도(`role='owner'` 단일성을 애플리케이션 레벨 트랜잭션으로 보장) + owner 탈퇴 시 그룹 해체 또는 자동 양도 규칙.
- 리스크: 브루트포스 — 100만 경우 × 10분 × 분당 60 req rate limit 으로 실용적 안전 but 공격 탐지 훅 없음. 딥링크 scheme 설정(app.json) 과 웹 `/invite/:code` UI 는 Phase 8 별도 이슈. 초대 발급 정원 pre-check 는 동시성 race 가능 — 수락 시 재확인으로 보완.

---

## 2026-04-21 14:57 · Issue #73 · 가족 플랜 그룹 모델 + checkout 자동 그룹 생성
- 브랜치: `feature/issue-73-family-plan-group-model`
- PR: #74 (merged)
- 변경 파일: 4개 (수정)
- 요약: 마이그레이션 #8 `plan-groups` — `plan_groups`(id, owner_user_id, plan_id, max_members=6, created_at/updated_at) + `plan_group_members`(id, plan_group_id, user_id, role CHECK(`owner|member`), joined_at) + 인덱스 4종 (idx_plan_groups_owner / idx_plan_group_members_group / idx_plan_group_members_user / UNIQUE idx_plan_group_members_unique(group_id,user_id)). `POST /billing/checkout` 에 가족 분기 추가 — `plan_type==='family'` 이면 plan_groups INSERT → plan_group_members role=`owner` INSERT → subscriptions.plan_group_id 에 그룹 id 연결. 응답 JSON 에 `plan_group:{id,owner_user_id,max_members}` (family 외 null) + `subscription.plan_group_id` 노출. vitest 마이그레이션 #8 스키마 테스트 + billing family 그룹 생성·연결 검증 + plus_personal 은 그룹 INSERT 미호출 검증 → 백엔드 326→339 / 26 파일 그린, tsc 에러 없음.
- 다음: Phase 5 #32 가족 플랜 초대 — `초대 코드` vs `이메일 초대` vs `링크 초대` 비교 문서 작성 후 `초대 코드(6자리 숫자, 만료 시간, 일회용) + 딥링크 하이브리드` 채택. `plan_group_invites` 테이블 + `POST /family/invites` 발급 + `POST /family/invites/:code/accept` 수락.
- 리스크: 가족 플랜 재결제 시 새 그룹이 중복 생성됨 — #32 초대 흐름 구현 시 기존 그룹 재사용 로직 필요. role='owner' 유일성은 애플리케이션 레벨 (partial UNIQUE index 후속 검토). 권한 양도(#33)도 별도.

---

## 2026-04-21 14:48 · Issue #71 · 이용권 코드 공유 UI + voucherShare 순수 헬퍼
- 브랜치: `feature/issue-71-voucher-share-ui`
- PR: #72 (merged)
- 변경 파일: 7개 (신규 4 + 수정 3)
- 요약: `packages/web/src/lib/voucherShare.ts` + `apps/mobile/src/lib/voucherShare.ts` 신규 — 동일 계약의 순수 헬퍼(`maskVoucherCode` 첫 그룹만 노출, `formatVoucherStatus` issued→미사용/used→사용됨/expired→만료, `isVoucherRedeemable` status=issued + 만료 전, `buildVoucherShareText` 플랜·코드·만료일·등록 안내 포함 한국어 문구). `getVouchers()` 서비스 함수 + `VoucherItem` 타입 웹/모바일 각각 추가. 웹 `SettingsPage` 에 '내 이용권 코드' 섹션 — 플랜명·상태 뱃지(초록/회색/빨강)·코드 평문·만료일·복사(clipboard)·공유(`navigator.share` 우선, fallback clipboard) 버튼. 비활성 코드는 disabled. vitest 웹 11건 + jest 모바일 7건 → 웹 36→47 / 모바일 67→74 그린, tsc 에러 없음.
- 다음: Phase 5 #31 가족 플랜 그룹 모델 — 마이그레이션 #8 `plan_groups`(id, owner_user_id, plan_id, max_members, created_at) + `plan_group_members`(plan_group_id, user_id, role owner|member, joined_at). `subscriptions.plan_group_id` 연결, 가족 플랜 결제 시 자동 그룹 생성 + owner 추가. vitest 마이그레이션·모델 테스트.
- 리스크: 모바일 전용 Settings 스크린 UI 미구현(서비스·헬퍼만 이식, 후속 이슈 예정). QR 렌더링·코드 URL 딥링크는 Phase 8+. `navigator.share` 미지원 브라우저에서 clipboard 권한이 없으면 최종 실패 토스트.

---

## 2026-04-21 14:41 · Issue #69 · 이용권 코드 등록 API (/billing/redeem)
- 브랜치: `feature/issue-69-voucher-redeem`
- PR: #70 (merged)
- 변경 파일: 2개 (수정)
- 요약: `POST /api/billing/redeem { code }` 신규 — 평문 포맷 검증(VA-XXXX-XXXX-XXXX, `toUpperCase` 정규화로 소문자 입력도 허용) → 사용자 조회(google_id→users.id) → `hashVoucherCode` 로 `code_hash` UNIQUE lookup → 상태/만료/자기발급 3중 검증 → voucher `status='used'` + `redeemed_by_user_id` + `used_at` 세팅 + 새 subscription INSERT(period_days 만큼 만료) + `users.plan` 동기화(personal→plus, family→family). 에러 매트릭스: 포맷/자기발급 400, 존재 안 함 404, 이미 used/expired 409, `expires_at` 지났지만 status=issued 면 409 + DB 에서 expired 자동 전환. vitest 10건 추가 (정상 2종 + 포맷/누락/없음/used/expired/자동expired/자기발급/소문자 정규화) → 백엔드 326→336 / 26 파일 그린, tsc 에러 없음.
- 다음: Phase 5 #30 코드 공유 UI — `GET /billing/vouchers` 응답 기반 웹/모바일 발급 코드 목록 + 복사 버튼 + 공유 링크 + 만료/사용상태 표시. 발급자 본인에게만 노출.
- 리스크: trace-level 감사 로그 없음(누가 언제 어느 코드를 등록했는지는 voucher_codes.used_at/redeemed_by_user_id 로만 추적). 결제 중복 발급과 마찬가지로 중복 등록도 DB 수준 잠금 없음. 가족 플랜 코드 등록 시 #31 그룹 연결은 후속 이슈에서 자동화.

---

## 2026-04-21 14:37 · Issue #67 · 이용권 코드 발급 (checkout 훅 + /billing/vouchers)
- 브랜치: `feature/issue-67-voucher-codes`
- PR: #68 (merged)
- 변경 파일: 6개 (신규 2 + 수정 4)
- 요약: 마이그레이션 #7 `voucher_codes` (code UNIQUE / code_hash UNIQUE / plan_id / issuer_user_id / issuer_subscription_id / redeemed_by_user_id nullable / status `issued|used|expired` / issued_at / used_at / expires_at) + 인덱스 3종. `lib/vouchers.ts` 신규 — VA-XXXX-XXXX-XXXX 포맷 생성(X=A-Z0-9, 시각적 혼동 문자 `0/O/1/I/L` 제외), SHA-256 hash hex(64자), `generateVoucherCode`/`hashVoucherCode`/`isValidVoucherCodeFormat` 노출. `/api/billing/checkout` 훅에 subscription INSERT 후 voucher 자동 1건 INSERT, 응답에 `{ voucher: { id, code, expires_at } }` 평문 노출(이 응답에서만). `GET /api/billing/vouchers` 신규 — 본인 `issuer_user_id` 필터 + plan JOIN 으로 발급 코드 전체 반환(평문 포함, 발급자에게만). vitest vouchers 10건(포맷/hash 결정성/혼동문자 회피/고유성) + billing 11→15건 + migrations 11→12건 → 백엔드 313→326 / 26 파일 그린, tsc 에러 없음.
- 다음: Phase 5 #29 코드 등록 API — `POST /api/billing/redeem { code }` 가 hash lookup 으로 voucher 조회 → 상태/만료 검증 → `status=used`, `redeemed_by_user_id` 세팅, 발급자와 등록자가 동일인이면 금지. 재사용 시 409.
- 리스크: 기존 활성 subscription 있는 사용자가 재결제 시 중복 voucher 발급됨 — 단일화는 후속. plan_group_id 는 여전히 #31 에서 채움. hash 는 SHA-256 salt 없음 (딕셔너리 공격 위험 있으나 코드 길이·알파벳 고려 시 실용적 안전).

---

## 2026-04-21 14:28 · Issue #65 · 스텁 결제 엔드포인트 (/billing/checkout, /subscription)
- 브랜치: `feature/issue-65-billing-stub`
- PR: #66 (merged)
- 변경 파일: 3개 (신규 2 + 수정 1)
- 요약: `packages/backend/src/routes/billing.ts` 신규 — `POST /checkout { plan_key }` 가 plans 테이블 조회 → 사용자 조회 → `subscriptions` 행 생성(status=`active`, expires_at=now+period_days) → `users.plan` 동기화(personal→`plus`, family→`family`). free 플랜/없는/비활성 plan_key/없는 사용자 모두 적절한 에러 응답. `GET /subscription` 가 활성 구독 + plans JOIN 으로 반환(없으면 `{subscription:null,plan:null}`). 실 PG(TossPayments/Iamport) 미연동 — `// TODO: integrate real PG` 주석, 결제수단 받지 않고 항상 성공 가정. `index.ts` 에 `/billing` 라우팅(api 하위, 인증 미들웨어 적용). vitest `billing.test.ts` 11건 (checkout 8 + subscription 3), 백엔드 302→313 / 25 파일 그린, tsc 에러 없음.
- 다음: Phase 5 #28 이용권 코드 발급 — checkout 완료 훅에서 `VA-XXXX-XXXX-XXXX` 포맷 1회용 코드 자동 발급, plans 테이블과 별도로 `voucher_codes` 테이블 추가(hash + status issued/used/expired).
- 리스크: 실 PG 연동 이전이라 checkout idempotency/재시도/환불 로직 없음. 기존 활성 구독이 있는 상태에서 재결제 시 중복 row 생성됨 — 후속 이슈에서 단일화 필요. plan_group_id 는 #31 가족 플랜 이전까지 nullable 유지.

---

## 2026-04-21 14:23 · Issue #63 · Plan·Subscription 모델 및 기본 플랜 3종 시드 (Phase 5 진입)
- 브랜치: `feature/issue-63-plan-subscription-model`
- PR: #64 (merged)
- 변경 파일: 2개 (수정)
- 요약: 마이그레이션 #6 추가 — `plans(id, key UNIQUE, name, plan_type free|personal|family, period_days, max_members, price_krw, is_active)` 와 `subscriptions(id, user_id, plan_id, plan_group_id nullable, status active|expired|cancelled, starts_at, expires_at)` 테이블 및 인덱스 4종(idx_plans_key, idx_subscriptions_user/status/expires). 기본 플랜 3종 `INSERT OR IGNORE` 시드 — `free`(무기한/1인/0원), `plus_personal`(30일/1인/4900원), `family`(30일/6인/9900원). `users.plan` 컬럼은 백워드 호환 위해 유지(활성 subscription 과 동기화 로직은 #27 결제 스텁에서 구현). `plan_group_id` 는 #31 가족 플랜 그룹 연결 이전까지 nullable. vitest 2건 추가 (테이블/인덱스/CHECK/시드 검증) → migrations 11건 / 전체 300→302건 그린, tsc 에러 없음.
- 다음: Phase 5 #27 스텁 결제 엔드포인트 — 실 PG 미연동, `POST /billing/checkout/{plan_key}` 가 더미 "완료" 응답을 반환하며 subscription row 생성 + users.plan 동기화.
- 리스크: 기존 사용자의 `users.plan` 값이 free 로 남아 있어도 활성 subscription 이 없는 한 일관성 문제는 없음. 결제 연동 이후 주기적 expiry 스윕 필요.

---

## 2026-04-21 14:17 · Issue #61 · 알람 미리듣기 액션 라우터 + 🔈 버튼 (Phase 4 종료)
- 브랜치: `feature/issue-61-mobile-tts-preview-action`
- PR: #62 (merged)
- 변경 파일: 3개 (수정)
- 요약: `alarmPlayback.ts` 에 `buildAlarmPreviewAction(plan)` 순수 함수 추가 — #59 의 PlaybackPlan 을 `navigate(/player)` / `preview-audio(uri,caption)` / `toast(message)` 액션으로 디스패치. tts 는 기존 player 화면으로 라우팅되어 자막(text) 이 자동 오버레이되고, sound-only / fallback 은 caption 을 자막으로 사용해 바로 재생. `(tabs)/alarms.tsx` 알람 카드에 🔈 미리듣기 버튼 추가 — `stopPropagation` 으로 편집 이동 차단, messages/voices 쿼리 연결해 resolver 에 전달, 실패 시 mock 파일 번들 안내 토스트. jest 6건 (buildAlarmPreviewAction 4 + 엔드투엔드 2), 모바일 61→67 / 전체 420→426. **Phase 4 종료** — TASK.md #19~#25 (Alarm 모델 확장 + CRUD 정규화 + 스케줄러 + 웹/모바일 편집 UI + sound-only/tts 재생) 7개 이슈 전부 달성.
- 다음: Phase 5 #26 Plan·Subscription 모델 — 개인/가족 플랜 스키마, 기간/상태, 결제 스텁 엔드포인트 설계
- 리스크: mock URI 실체 번들 후속. 노티피케이션 발화 시 자동 재생(백그라운드 오디오 세션) 은 별도 이슈. speaker 별 세그먼트 오버레이는 Phase 6 이후.

---

## 2026-04-21 14:12 · Issue #59 · 알람 재생 resolver (sound-only mock) + 모드 뱃지
- 브랜치: `feature/issue-59-mobile-alarm-playback-resolver`
- PR: #60 (merged)
- 변경 파일: 3개 (신규 2 + 수정 1)
- 요약: `apps/mobile/src/lib/alarmPlayback.ts` 신규 — 순수 함수 `resolveAlarmPlayback(alarm, messages, voices)` 가 `mode` / `voice_profile` / 메시지 매칭 여부에 따라 `tts` / `sound-only` / `fallback` / `error` 계획을 반환. sound-only 는 voice_profile 미지정·미매칭·`processing|failed` 모두 `MOCK_DEFAULT_ALARM_URI` fallback 하고, 정상 경로에서만 `MOCK_VOICE_SAMPLE_URI` 반환. 실 교체 지점에 `// TODO: real perso.ai voice sample URL` 주석. `getAlarmModeBadge` 헬퍼로 `(tabs)/alarms.tsx` 알람 카드에 🔊 원본 / 🗣️ TTS 뱃지 표시. jest 11건 (resolveAlarmPlayback 8 + getAlarmModeBadge 3), 모바일 50→61 / 전체 409→420.
- 다음: Phase 4 #25 알람 재생 (tts) — 샘플 + 자막 오버레이 방식의 mock TTS 재생 경로. 이어서 알람 시각 도달 시 자동 재생 파이프라인(노티피케이션 → 포그라운드 player 라우팅).
- 리스크: `asset:///audio/mock-*.mp3` 는 계약 URI 만 정의 — 실제 번들 파일은 후속 이슈. Player 화면은 여전히 TTS 로컬 캐시 기반이라 sound-only 경로 실재생은 #25 에서 연결.

---

## 2026-04-21 14:06 · Issue #57 · 모바일 알람 편집 화면 mode 토글 및 voice_profile 연결
- 브랜치: `feature/issue-57-mobile-alarm-mode-ui`
- PR: #58 (merged)
- 변경 파일: 8개 (신규 2 + 수정 6)
- 요약: `apps/mobile/src/lib/alarmForm.ts` 신규 — 웹(#55)과 동일 계약의 `validateAlarmForm`/`buildCreatePayload`/`parseRepeatDays` 순수 헬퍼. `Alarm` 타입에 `mode / voice_profile_id / speaker_id` 추가, `repeat_days: number[] | string` 으로 호환 확장. `createAlarm`/`updateAlarm` 서비스 옵션 확장. `app/alarm/create.tsx`, `app/alarm/edit.tsx` 에 🗣 TTS / 🔊 원본 radio 토글과 음성 프로필 picker 추가 — sound-only 시 음성 프로필 미지정이면 제출 버튼 disabled + 안내. 기존 3곳의 `JSON.parse(alarm.repeat_days||'[]')` (`edit.tsx`, `(tabs)/alarms.tsx`, `services/notifications.ts`) 을 `parseRepeatDays` 로 안전 치환 — 백엔드 #20 정규화 이후 배열 응답과 과거 문자열 응답 양쪽 대응. jest 17건 추가 (buildCreatePayload 5 / validateAlarmForm 6 / parseRepeatDays 6), 모바일 33→50 / 전체 359→409.
- 다음: Phase 4 #24 알람 재생 (sound-only) — 선택된 voice_profile 의 mock 음성 파일을 알람 시각에 재생하는 로컬 파이프라인. 이어서 #25 tts 재생(샘플 + 자막 오버레이).
- 리스크: speaker picker 는 이번에도 연결 안 함(voice_profile 만). `repeat_days` 타입이 `number[] | string` 인 채 남아 있어 런타임 분기 필요 — Phase 10에서 타입 좁히기 후보.

---

## 2026-04-21 13:54 · Issue #55 · 웹 알람 편집 화면 mode 토글 및 voice_profile 연결
- 브랜치: `feature/issue-55-web-alarm-mode-ui`
- PR: #56 (merged)
- 변경 파일: 5개 (신규 2 + 수정 3)
- 요약: `packages/web/src/lib/alarmForm.ts` 신규 — `validateAlarmForm`/`buildCreatePayload` 순수 함수, sound-only 는 `voice_profile_id` 요구. `types.ts::Alarm` 에 mode/voice_profile_id/speaker_id 추가 및 repeat_days `number[] | string` 호환. `services/api.ts::createAlarm` 타입 확장. `AlarmsPage` 알람 카드에 모드 뱃지(🔊 원본 / 🗣️ TTS) + 생성/편집 폼에 재생 모드 라디오 그룹 추가 — sound-only 는 음성 프로필 필수로 버튼 disabled + 안내 문구. `formatRepeat`/편집 초기화의 `JSON.parse` 를 배열/문자열 양쪽 호환으로 교체. vitest 10건 추가. 모노레포 web 26→36 / 전체 349→359.
- 다음: Phase 4 #23 모바일 알람 편집 화면 (동일 UX 의 RN 버전)
- 리스크: speaker_id 선택 UI 는 후속 (speakerPicker 와 알람 폼 통합 미정). 기존 응답 호환을 위해 `repeat_days` 가 number[] | string 로 남아 있음 — 백엔드 구 엔드포인트 제거 후 단일화 가능.

---

## 2026-04-21 13:47 · Issue #53 · 알람 스케줄러 + Cloudflare Cron Trigger 스텁
- 브랜치: `feature/issue-53-alarm-scheduler`
- PR: #54 (merged)
- 변경 파일: 5개 (신규 2 + 수정 3)
- 요약: `src/lib/scheduler.ts` 신규 — `shouldAlarmFire`/`selectFiringAlarms`/`formatHHmm` 순수 함수. HH:mm + repeat_days(빈 배열=매일) + is_active 체크로 발화 대상 판정. `src/index.ts` 에 `scheduled(event, env)` export 추가 — Cloudflare Workers Cron Trigger 진입점, 활성 알람 조회→`selectFiringAlarms`→`console.warn` 로 `firing_ids` 로깅. 실 푸시는 `// TODO: FCM delivery`. `routes/alarm.ts` 에 `GET /alarm/tick` 디버그 엔드포인트 추가 — 인증된 유저의 활성 알람을 현재 UTC 시각 기준으로 드라이런. vitest 11건 추가 (scheduler 9 + tick 2). 모노레포 backend 289→300 / 전체 338→349.
- 다음: Phase 4 #22 웹 알람 편집 화면 — mode / voice_profile_id / speaker_id 를 웹 UI 에 노출 (또는 #23 모바일 알람 편집)
- 리스크: `wrangler.toml` Cron Trigger 실등록 + 실제 FCM 발송은 별도 이슈. 스케줄러는 UTC 기준 — 타임존 처리는 클라이언트가 HH:mm 저장 시 로컬 환산한다고 가정. 사용자 타임존 필드 도입은 후속.

---

## 2026-04-21 13:42 · Issue #51 · 알람 CRUD 응답 정규화 — repeat_days/is_active/mode 일관화
- 브랜치: `feature/issue-51-alarm-response-normalize`
- PR: #52 (merged)
- 변경 파일: 2개 (수정)
- 요약: `routes/alarm.ts` 에 `normalizeAlarmRow` 헬퍼 도입 — repeat_days JSON→배열(잘못된 JSON 은 빈 배열 fallback), is_active→boolean, mode null→`tts` 기본, voice_profile_id/speaker_id `undefined`→`null`. GET list/single/PATCH 반환 전부 동일 헬퍼 통과. POST 응답도 voice_profile_id/speaker_id 를 null 로 명시적 노출(body 스프레드 의존 제거). vitest 6건 추가 (목록 정규화, sound-only 노출, 잘못된 JSON fallback, 단일 정규화 + 404, POST null 명시). 모노레포 backend 283→289 / 전체 332→338.
- 다음: Phase 4 #21 알람 스케줄링 (인메모리 `setInterval` 기반 개발용 스케줄러 + Cloudflare Workers Cron Trigger TODO 주석) 또는 #22 웹 알람 편집 화면(새 mode/voice_profile 필드 UI 노출)
- 리스크: 정규화는 응답만 바꾸므로 기존 DB 레코드 호환. 기존 웹/모바일 클라이언트가 `repeat_days` 를 문자열로 파싱하던 코드가 있으면 중복 JSON.parse 발생할 수 있어 UI 이슈에서 정리 필요(후속 이슈에서 처리).

---

## 2026-04-21 13:38 · Issue #49 · Alarm 모델 확장 — mode/voice_profile_id/speaker_id (Phase 4 진입)
- 브랜치: `feature/issue-49-alarm-model-mode`
- PR: #50 (merged)
- 변경 파일: 4개 (수정)
- 요약: 마이그레이션 #5 `alarm-mode-voice-speaker` — `alarms` 에 `mode TEXT NOT NULL DEFAULT 'tts' CHECK(mode IN ('sound-only','tts'))`, `voice_profile_id TEXT`, `speaker_id TEXT` 컬럼 + 인덱스 2종 추가 (ALTER TABLE ADD COLUMN 방식). `routes/alarm.ts` POST/PATCH 모두에 mode 허용값 검증 + UUID 형식 검증 + INSERT/UPDATE/SELECT SQL 확장. 기본 mode = `tts`. vitest 7건 추가 (alarm 6 + migrations 1). 모노레포 backend 276→283 / 전체 358→332(다른 워크스페이스 변화 없음, 총합 체크로 backend 283 + shared 12 + voice 11 + web 26 = 332).
- 다음: Phase 4 후속 — 알람 트리거 실행 경로(워커/크론) 및 모드별 재생 경로(TTS 합성 vs sound-only 원본 재생) 연결
- 리스크: 컬럼 추가만 했을 뿐 실제 재생·트리거 경로는 아직 미연결 — 후속 이슈에서 구현. 기존 알람 레코드는 mode 기본값 `tts` 로 채워짐(스키마 NOT NULL DEFAULT).

---

## 2026-04-21 13:29 · Issue #47 · 음성 업로드/화자 편집 E2E 테스트 (Phase 3 종료)
- 브랜치: `feature/issue-47-voice-e2e-test`
- PR: #48 (merged)
- 변경 파일: 2개 (신규 1 + 수정 1)
- 요약: `packages/backend/test/voice.e2e.test.ts` 신규 — 업로드 → mock 분리 → 라벨 변경 → 목록 조회 체인을 실제 라우트 로직으로 관통하는 E2E 5건 (정상 1 / 다른 사용자 분리 403 / 미존재 목록 404 / 다른 사용자 PATCH 403 / speaker 미매칭 PATCH 404). `helpers.createMockDB().clearResults()` 추가 — 분리 단계 INSERT 미소비분이 다음 SELECT 를 삼키지 않도록 분리, `calls` 이력은 보존. 모노레포 backend 271→276 / 전체 353→358. **Phase 3 완료** (Phase 3 범위: 음성 어댑터 + 업로드 + 화자 분리 + 선택 UI 웹/앱 + 음성 라이브러리 이름 변경 + E2E).
- 다음: Phase 4 #19 Alarm 모델 — 현재 스키마 감사 후 음성 모드(sound-only/tts)·화자 연결·모드별 필드 보강 점검
- 리스크: E2E 는 여전히 DB mock 위에서 동작 — 실 libsql 통합/실오디오 E2E 는 별도 CI 단계(Phase 8+)에서. `/voice/diarize` 는 그대로 ElevenLabs 경로 유지.

---

## 2026-04-21 13:23 · Issue #45 · 음성 프로필 이름 변경
- 브랜치: `feature/issue-45-voice-profile-rename`
- PR: #46 (merged)
- 변경 파일: 10개 (신규 4 + 수정 6)
- 요약: 백엔드 `PATCH /voice/:id` 신규 — UUID 검증 + JSON body 파싱 + trim 후 1~50자 검증 + 소유권 확인 + `updated_at = datetime('now')` 갱신. 웹 `services/api.ts::updateVoiceProfile` + `VoicesPage` 카드에 "이름 변경" 버튼(window.prompt) + `src/lib/voiceName.ts` 순수 함수. 모바일 `services/api.ts::updateVoiceProfile` + `app/voice/[id].tsx` 인라인 `TextInput` 편집 UI(iOS/Android 공통) + `src/lib/voiceName.ts` 순수 함수. 테스트 16건 추가 (backend 6 + web 5 + mobile 5). 모노레포 백엔드 271건 / 전체 353건 통과.
- 다음: #18 음성 업로드·재생 E2E (또는 업로드 라이브러리 리스트 화면 — 업로드/화자 섹션은 별도 이슈로 분리된 상태)
- 리스크: `VoicesPage` 이름 변경은 `window.prompt` 로 단순화 — 완전한 모달 UI 는 추후 개선. 모바일 이름 편집은 `_layout.tsx` 헤더 제목과 동기화되지 않을 수 있음(쿼리 invalidate 로 리스트는 최신).

---

## 2026-04-21 13:28 · Issue #43 · 화자 선택 UI 모바일
- 브랜치: `feature/issue-43-mobile-speaker-picker`
- PR: #44 (merged)
- 변경 파일: 5개 (신규 3 + 수정 2)
- 요약: 모바일 `services/api.ts` 에 `uploadVoiceAudio`/`separateUpload`/`listSpeakers`/`renameSpeaker` 헬퍼 추가 (snake ↔ camel normalize). `src/lib/speakerPickerState.ts` 순수 reducer 분리 — idle/uploading/separating/ready/error 전이 + SELECT/EDIT_* 액션 + `sanitizeLabel`. `app/voice/picker.tsx` 신규 화면 — `useReducer` + `expo-document-picker` 기반 파일 선택 → 업로드 → 기존 결과 재사용 or 분리 → radio 선택 + inline 라벨 편집. `(tabs)/voices.tsx` 헤더에 "화자 감지 (mock)" 카드 링크 추가. jest 12건 추가 (reducer 8 + sanitizeLabel 4). 모노레포 총 337건 통과.
- 다음: #17 음성 라이브러리 화면 — 등록된 음성·화자 목록·삭제·이름 변경 (웹/앱)
- 리스크: 선택 화자 → `voice_profiles` 클론 전환은 후속. 기존 `diarize.tsx` ElevenLabs 경로는 그대로.

---

## 2026-04-21 13:18 · Issue #41 · 화자 선택 UI 웹 + 라벨 편집 API
- 브랜치: `feature/issue-41-web-speaker-picker`
- PR: #42 (merged)
- 변경 파일: 6개 (신규 2 + 수정 4)
- 요약: 백엔드에 `PATCH /voice/uploads/:uploadId/speakers/:speakerId` 추가 (라벨 1~50자, 소유권+매칭 검증). 웹 `services/api.ts` 에 `uploadVoiceAudio`/`separateUpload`/`listSpeakers`/`renameSpeaker` 헬퍼 + 타입 추가 (snake ↔ camel 흡수). 신규 `SpeakerPicker` 컴포넌트 — 모달 내 업로드 → 기존 결과 재사용 or 분리 → radio 선택 + inline 라벨 편집. `VoicesPage` 헤더에 "화자 감지" 버튼 연결. 기존 `Row` 캐스트 3곳을 `unknown` 경유로 변경해 tsc strict 통과. 테스트 14건 추가 (backend 7 + web 7). 모노레포 총 325건 통과.
- 다음: #16 모바일 화자 선택 UI
- 리스크: 선택 화자의 voice_profiles 클론 전환은 후속. 모바일은 #16 담당. 오디오 세그먼트 재생 UI 미포함(InlineAudioPlayer 연결은 URL 체계 정리 후).

---

## 2026-04-21 13:05 · Issue #39 · 업로드 오디오 화자 분리 mock
- 브랜치: `feature/issue-39-voice-separate-mock`
- PR: #40 (merged)
- 변경 파일: 5개 (수정)
- 요약: 마이그레이션 #4 `voice-speakers` 테이블/인덱스 추가. `POST /voice/uploads/:uploadId/separate` — 업로드 소유권 확인 후 `MockVoiceProvider.separate` 호출, 기존 세그먼트 삭제 후 새 `화자 N` 라벨로 INSERT. `GET /voice/uploads/:uploadId/speakers` — 시작 시간 오름차순 조회. `helpers.createMockDB().reset()` 이 `calls`+`results` 양쪽 큐를 비우도록 확장(테스트 격리 픽스). `// NEEDS_VERIFICATION: real diarization` 마커로 실연동 지점 표시. vitest 9건 추가 (voice 분리 8 / 마이그레이션 1).
- 다음: #15 화자 선택 UI 웹 (분리된 세그먼트 시각화 + 라벨 편집)
- 리스크: `/voice/diarize` 기존 라우트는 여전히 ElevenLabs 호출 경로 유지(별도 팔로업). 화자 라벨은 `화자 1/2/3` 고정 — 사용자 편집은 다음 이슈에서 처리.

---

## 2026-04-21 12:48 · Issue #37 · 원본 오디오 업로드 API + VoiceStorage 추상화
- 브랜치: `feature/issue-37-voice-upload-api`
- PR: #38 (merged)
- 변경 파일: 9개 (신규 2 + 수정 7)
- 요약: `packages/voice` 에 `VoiceStorage` 인터페이스 + `InMemoryVoiceStorage` 추가 (`// TODO: real object storage integration`). 마이그레이션 #3 `voice-uploads` 테이블 추가 (object_key/mime_type/size_bytes/duration_ms/original_name + 인덱스 2종). 백엔드 `POST /voice/upload` 라우트 신규 — multipart audio + 선택 durationMs/originalName, 10 MiB 제한, `audio/*` MIME 강제. 테스트 11건 추가 (voice 패키지 4 / backend voice.upload 6 / migrations 1).
- 다음: #14 화자 분리 mock (업로드된 object_key → MockVoiceProvider.separate 연결)
- 리스크: `InMemoryVoiceStorage` 는 Workers 리퀘스트 간 공유 불가 — 실환경에서 R2/S3 어댑터 필요. 기존 `/voice/clone` 은 아직 ElevenLabs 직접 호출 상태 (팔로업).

---

## 2026-04-21 12:40 · Issue #35 · `packages/voice` 어댑터 인터페이스 + MockVoiceProvider
- 브랜치: `feature/issue-35-voice-provider-scaffold`
- PR: #36 (merged)
- 변경 파일: 8개 (신규 7 + package-lock)
- 요약: `@voice-alarm/voice` 워크스페이스 신규. `VoiceProvider` 인터페이스 (`enroll`·`synthesize`·`separate`) 와 결정론적 `MockVoiceProvider` 구현. zod 기반 입력/결과 스키마로 검증. `// TODO: real perso.ai integration` · `// TODO: real elevenlabs integration` 주석으로 실연동 지점 명시. vitest 7건 추가 (enroll 3 / synthesize 2 / separate 2). **Phase 3 진입.**
- 다음: #13 음성 업로드 API (multipart + fixture)
- 리스크: 백엔드 라우트에 아직 연결 안 됨 — 다음 이슈에서 주입. `separate` 는 해시 기반 의사-감지로 실제 화자 감지 아님(주석 표기).

---

## 2026-04-21 12:36 · Issue #33 · 모바일 로그인·가입 화면 (이메일+비밀번호)
- 브랜치: `feature/issue-33-mobile-email-login`
- PR: #34 (merged)
- 변경 파일: 5개 (신규 3, 수정 2)
- 요약: RN `EmailPasswordForm` 신규 (로그인/가입 탭, 8자 검증, 로딩 스피너). `validateEmailPasswordForm` 순수 함수로 분리 → jest 가 AsyncStorage 없이 단독 테스트. `_layout.tsx` 에 `AuthProvider` 래핑, 홈 탭 비로그인 영역에 이메일 폼 + 구분선 + 기존 `LoginButtons` 공존. `useAuth` ↔ `useAppStore.setAuth` 동기화. jest 7건 추가. **Phase 2 완료.**
- 다음: #12 `packages/voice` 어댑터 인터페이스 (Phase 3 시작)
- 리스크: `LoginButtons` (Google/Apple) 는 여전히 `useAppStore.setAuth` 직접 호출 — 향후 `useAuth.loginWithToken` 으로 통합 필요 (팔로업 이슈).

---

## 2026-04-21 12:28 · Issue #31 · 웹 로그인·가입 화면 (이메일+비밀번호)
- 브랜치: `feature/issue-31-web-email-login`
- PR: #32 (merged)
- 변경 파일: 6개 (신규 2, 수정 4)
- 요약: `EmailPasswordForm` 컴포넌트 신규 (로그인/가입 탭, 8자 검증, 에러 표시). `LoginPage` 는 `useAuth` 직접 사용 — 이메일 폼을 기본 경로로, Google 버튼은 새로 추가한 `loginWithToken(idToken)` 으로 일원화. `App.tsx` 에서 `useState(isLoggedIn)` + `localStorage` 직접 접근 제거 → `useAuth().isAuthenticated`. `main.tsx` 에서 `AuthProvider` 래핑. vitest 5건 추가.
- 다음: #11 모바일 로그인·가입 화면 (React Native 대응)
- 리스크: 없음. 루트 테스트 277건 / lint 0 errors / typecheck 전 워크스페이스 통과.

---

## 2026-04-21 12:12 · Issue #29 · 공용 useAuth 훅 + AuthProvider
- 브랜치: `feature/issue-29-useauth-hook`
- PR: #30 (merged)
- 변경 파일: 5개 (신규)
- 요약: 웹(`localStorage`)/모바일(`AsyncStorage`) 양쪽에 대응하는 `AuthProvider` + `useAuth` 훅 구현. 초기 마운트 시 저장된 토큰으로 `/auth/me` 복원, 401 자동 로그아웃, `fetchImpl`·`storage` 주입으로 테스트 용이. 모바일 쪽은 `authApi.ts` 순수 함수로 fetch 분리. vitest 7 + jest 7 추가.
- 다음: #10 웹 로그인·가입 화면 (`useAuth` 를 실제 UI 에 연결)
- 리스크: `AuthProvider` 는 아직 App.tsx / mobile _layout.tsx 에 장착되지 않음 — 다음 이슈에서 연결.

---

## 2026-04-21 12:03 · Issue #27 · 이메일+비밀번호 가입/로그인 API
- 브랜치: `feature/issue-27-email-password-auth`
- PR: #28 (merged)
- 변경 파일: 17개
- 요약: bcryptjs + 환경 페퍼로 비밀번호 해싱, Web Crypto HS256 JWT 발급/검증, `/api/auth/register|login|me` 추가, `authMiddleware` 에서 자체 JWT 수용. 마이그레이션 #2 로 users 테이블 재정비 (google_id nullable, password_hash, email UNIQUE). zod 스키마 및 vitest 25건 추가.
- 다음: #9 인증 미들웨어 통합 + 웹/앱 공용 `useAuth` 훅 설계
- 리스크: 프로덕션에 `JWT_SECRET`·`PASSWORD_PEPPER` 시크릿 등록 필요 (배포 시 `wrangler secret put`). 비밀번호 재설정 플로우는 별도 이슈.

---

## 2026-04-17 · Issue #15 · 프로젝트 진단 및 베이스라인 문서화
- 브랜치: `feature/issue-15-project-diagnosis`
- PR: #16 (merged)
- 변경 파일: 5개 (문서만)
- 요약: `TASK.md` 커밋, `docs/STRUCTURE_BASELINE.md` · `docs/ARCHITECTURE_DECISION.md` · `docs/DIAGNOSIS.md` 신규, `PROGRESS.md` 초기화.
- 다음: #17 모노레포 구조 유지 확정 + `packages/shared` 스캐폴드
- 리스크: 없음 (문서 PR)

---

## 2026-04-21 · Issue #25 · DB 선정 & 번호 기반 마이그레이션 러너 도입
- 브랜치: `feature/issue-25-db-migration-tool`
- PR: #26 (merged)
- 변경 파일: 4개
- 요약: Turso + 자체 마이그레이션 러너 결정(ADR-006). 인라인 SQL → 번호 기반 마이그레이션으로 정비. db.ts 130줄→10줄 단순화. 테스트 5건 추가.
- 다음: Phase 2 #8 User 모델 & 가입/로그인 API
- 리스크: 없음

---

## 2026-04-21 · Issue #23 · CI 워크플로우 보강
- 브랜치: `feature/issue-23-ci-workflow`
- PR: #24 (merged)
- 변경 파일: 1개
- 요약: ci.yml에 develop_loop 트리거, lint job, test job 추가. typecheck 매트릭스에 shared 추가. **Phase 1 완료.**
- 다음: Phase 2 #7 DB 선정 & 마이그레이션 도구
- 리스크: 없음

---

## 2026-04-21 · Issue #21 · 기본 테스트 러너 설정
- 브랜치: `feature/issue-21-test-runner-setup`
- PR: #22 (merged)
- 변경 파일: 6개
- 요약: `packages/web`에 vitest+jsdom, `apps/mobile`에 jest-expo 설정. 기본 테스트 각 2건 추가. 루트 `npm test`로 전체 222건 일괄 실행 가능.
- 다음: #6 CI 초안 (GitHub Actions)
- 리스크: 없음

---

## 2026-04-21 · Issue #19 · 린트·포맷·타입체크 파이프라인 통합
- 브랜치: `feature/issue-19-lint-typecheck-pipeline`
- PR: #20 (merged)
- 변경 파일: 3개
- 요약: 루트 `typecheck` 스크립트 추가, `packages/web`·`apps/mobile`에 typecheck 스크립트 추가. `lint`, `format:check`, `typecheck` 루트에서 일괄 실행 가능.
- 다음: #5 기본 테스트 러너 설정 (Vitest + Jest)
- 리스크: 기존 포맷 미적용 파일 103건, ESLint 경고 12건 (별도 이슈로 처리)

---

## 2026-04-17 · Issue #17 · 모노레포 구조 유지 + packages/shared 스캐폴드
- 브랜치: `feature/issue-17-shared-scaffold`
- PR: (작성 예정)
- 변경 파일: 8개 (신규 `packages/shared/**` + `package-lock.json` 갱신)
- 요약: `@voice-alarm/shared` 워크스페이스 추가, `UserPlan`·`UserSchema`·`VoiceProfile` zod 스키마와 vitest 6건 추가.
- 다음: 루트 통합 typecheck 스크립트 + 웹/모바일 테스트 러너 추가 이슈 생성
- 리스크: 기존 백엔드/웹/모바일은 아직 `@voice-alarm/shared` 를 import 하지 않음 — 후속 이슈에서 점진 적용.

---
