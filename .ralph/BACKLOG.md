# BACKLOG

## P0 (지금 바로) — 프로젝트 정리 + 탭 구조 개편

### Phase 1-A: packages/web 삭제
- [ ] `packages/web/` 디렉토리 전체 삭제
- [ ] `.github/workflows/deploy-web.yml` 삭제
- [ ] 루트 `package.json`에서 `"web"` 스크립트 제거
- [ ] `eslint.config.js`에서 `packages/web/src/**` 패턴 제거
- [ ] `.github/workflows/ci.yml` — typecheck/test matrix에서 `packages/web` 제거
- [ ] `.github/dependabot.yml`에서 `/packages/web` 섹션 삭제
- [ ] `CLAUDE.md` — `Web: React + TypeScript + Vite + Tailwind CSS` 줄, `packages/web` 줄 삭제
- [ ] `ARCHITECTURE.md` — web 관련 섹션 삭제
- [ ] `README.md` — web 대시보드 관련 언급 삭제
- [ ] `.ralph/PROMPT.md` — web 참조 삭제 (디렉토리, 빌드, 배포)
- [ ] `packages/backend/src/index.ts` — CORS ALLOWED_ORIGINS에서 web origin 3개 삭제 (`voice-alarm.pages.dev`, `voicealarm.pages.dev`, `voice-alarm-web.pages.dev`)
- [ ] `npm install` 실행하여 lock 파일 재생성
- [ ] `npm run lint && npm run typecheck` 통과 확인

### Phase 1-B: 모바일 탭 축소 (8개 → 5개)
- [ ] `app/(tabs)/character.tsx` → `app/character/index.tsx` 스택 화면으로 이동
- [ ] `app/(tabs)/library.tsx` → `app/library/index.tsx` 스택 화면으로 이동
- [ ] `app/(tabs)/_layout.tsx` — friends/family/character/library Screen 제거, people Screen 추가 (아이콘: 👤, 라벨: `tab.people`)
- [ ] `app/(tabs)/index.tsx` — 홈 화면에 캐릭터 미니 위젯 삽입 (이모지 + 레벨 + 프로그레스바, 탭 시 `/character`로 이동)
- [ ] `app/(tabs)/index.tsx` — 홈 화면에 "최근 메시지" 섹션 추가 (2-3개 표시 + "전체 보기" → `/library` 이동)
- [ ] `src/i18n/ko.json` — `tab.friends`, `tab.family`, `tab.character`, `tab.library` 삭제, `tab.people: "내 사람들"` 추가
- [ ] `src/i18n/en.json` — 동일 키 변경
- [ ] `app/(tabs)/friends.tsx` 삭제 (Phase 2에서 people.tsx로 대체)
- [ ] `app/(tabs)/family.tsx` 삭제 (Phase 2에서 people.tsx로 대체)
- [ ] typecheck 통과 확인

## P1 — Friends + Family 탭 통합 (People)

### People 탭 신규 생성
- [ ] `app/(tabs)/people.tsx` 신규 — 세그먼트 컨트롤 (멤버/친구/요청)
- [ ] 플랜별 UI 분기: free/personal → "멤버" 세그먼트 숨김 (기본탭 "친구"), family → "멤버" 세그먼트 표시 (기본탭 "멤버")
- [ ] 친구 세그먼트: friends.tsx에서 이메일 검색 + 자동완성 + 친구 추가/삭제/목록 로직 이동
- [ ] 요청 세그먼트: friends.tsx에서 대기중 요청 수락/거절 로직 이동
- [ ] 멤버 세그먼트: family.tsx에서 가족 멤버 표시 + 초대코드 발급 UI 이동
- [ ] 커플 뷰(family 2인 그룹): 서로가 보이는 간결한 카드 레이아웃

### 컴포넌트 추출
- [ ] `src/components/FamilyMemberRow.tsx` 신규 — family.tsx의 MemberRow 컴포넌트 추출
- [ ] `src/components/PeopleSkeletonCard.tsx` 신규 — friends.tsx의 SkeletonCard 추출

### 가족 알람 분리
- [ ] `app/family-alarm/create.tsx` 신규 — family.tsx의 알람 예약 폼 분리 (수신자 선택, 시간, 메시지, 반복요일)
- [ ] People 탭 멤버 세그먼트에 "가족 알람 보내기" 버튼 → `/family-alarm/create` 이동

### i18n 추가
- [ ] `src/i18n/ko.json`에 `people.*` 키 추가 (멤버, 친구, 요청, 초대코드, 가족알람 등)
- [ ] `src/i18n/en.json` 동일
- [ ] typecheck 통과 확인

## P2 — 캐릭터 시스템 정비 (나무 테마 + 스트릭)

### 백엔드: DB 스키마 (마이그레이션 13)
- [ ] `packages/backend/src/lib/migrations.ts` — 마이그레이션 13 추가:
  - characters 테이블에 `current_streak`, `longest_streak`, `last_wakeup_date` 컬럼 추가
  - `character_stats` 테이블 신규 (diligence, health, consistency)
  - `streak_achievements` 테이블 신규 (milestone: 7/30/90, achieved_at)

### 백엔드: 스트릭 로직
- [ ] `packages/backend/src/lib/streak.ts` 신규 — 연속 기상 판정 로직:
  - `computeStreak(lastWakeupDate, todayDate, currentStreak)` → `{ newStreak, milestoneReached }`
  - 어제=streak+1, 오늘=변경없음, 2일+=리셋(1)
  - 7/30/90일 마일스톤 도달 시 streak_achievements 기록
- [ ] `packages/backend/src/lib/xpRules.ts` — streak_bonus_7(100XP), streak_bonus_30(500XP), streak_bonus_90(2000XP) 이벤트 추가 (일일캡 면제)
- [ ] `packages/backend/src/lib/character.ts` — 능력치 계산 함수 추가 (diligence=알람완료횟수, health=루틴완료, consistency=활동일수)

### 백엔드: API 확장
- [ ] `packages/backend/src/routes/character.ts` — GET /characters/me 응답에 streak, stats, achievements 필드 추가
- [ ] `packages/backend/src/routes/character.ts` — POST /characters/xp에 스트릭 계산 + 능력치 업데이트 통합
- [ ] 클라이언트에서 `local_date` (YYYY-MM-DD) 전송하도록 API 설계 (타임존 대응)
- [ ] typecheck 통과 확인

### 프론트엔드: 캐릭터 화면 강화
- [ ] `apps/mobile/app/character/index.tsx` — 스트릭 뱃지 UI (🔥 N일 연속 기상)
- [ ] `apps/mobile/app/character/index.tsx` — 능력치 바 표시 (뿌리깊이/줄기튼튼함/잎무성함)
- [ ] `apps/mobile/app/character/index.tsx` — 마일스톤 달성 기록 섹션 (7일/30일/90일 배지)
- [ ] `apps/mobile/app/(tabs)/index.tsx` — 홈 캐릭터 위젯에 스트릭 카운트 표시
- [ ] `apps/mobile/src/services/api.ts` — CharacterResponse 타입에 streak/stats/achievements 필드 추가
- [ ] `apps/mobile/src/i18n/ko.json` — 스트릭/능력치 관련 번역 키 추가
- [ ] typecheck 통과 확인

### 나무 테마 강화
- [ ] `apps/mobile/src/lib/character.ts` — 나무 메타포 대사 업데이트 (스트릭 관련: "뿌리가 깊어지고 있어요")
- [ ] 능력치 이름 나무 테마 적용: diligence→뿌리 깊이, health→줄기 튼튼함, consistency→잎 무성함

## P3 — 배포 + 서비스화

### R2 스토리지 연동 (음성 파일)
- [ ] `packages/backend/wrangler.toml` — R2 bucket 바인딩 추가 (`VOICE_BUCKET`, bucket: `voice-alarm-voices`)
- [ ] `packages/backend/src/types.ts` — Env에 `VOICE_BUCKET: R2Bucket` 추가
- [ ] `packages/backend/src/routes/voice.ts` — 업로드 시 R2에 저장, 다운로드 시 R2에서 읽기 (메모리 저장 교체)
- [ ] typecheck 통과 확인

### FCM 푸시 구조 세팅
- [ ] `packages/backend/src/lib/migrations.ts` — 마이그레이션 14: `push_tokens` 테이블 (user_id, token, platform)
- [ ] `packages/backend/src/lib/fcm.ts` 신규 — FCM HTTP v1 API 클라이언트 (구조만, 실 전송은 console.warn 로그)
- [ ] `packages/backend/src/index.ts` — scheduled()에서 firing 알람 → FCM 전송 호출 (182행 TODO 해결)
- [ ] `apps/mobile/src/services/push.ts` 신규 — expo-notifications로 FCM 토큰 발급 + 서버 등록
- [ ] `apps/mobile/src/services/api.ts` — `registerPushToken(token, platform)` 함수 추가
- [ ] `apps/mobile/app/_layout.tsx` — 앱 시작 시 push 토큰 등록 호출
- [ ] typecheck 통과 확인

### 배포 설정 정비
- [ ] `packages/backend/wrangler.toml` — cron 트리거 `*/5 * * * *` (5분 간격) 추가
- [ ] Cloudflare Workers 무료 티어 제한 검증 (100k req/day, 10ms CPU)
- [ ] Turso 무료 티어 제한 검증 (9GB, 25M reads/month)
- [ ] `wrangler deploy` 테스트 (백엔드 배포 성공 확인)

## P4 — 기획서(Notion) 동기화 + 추가 정비

### Notion 기획서 업데이트
- [ ] 기획서 섹션 7 "기술 스택" — 실제 스택으로 수정 (RN/Expo, Hono+CF Workers, Turso, JWT 자체인증)
- [ ] 기획서 섹션 6 "개발 로드맵" — 현재 구현 상태 반영 (Phase 1 MVP 대부분 완료)
- [ ] 기획서 "현재 이슈" — 실제 이슈 목록으로 갱신

### 온보딩 플로우 기획서 정렬
- [ ] `apps/mobile/app/onboarding.tsx` — 기획서 시나리오에 맞게 흐름 점검 (음성 녹음 → 클론 → 알람 설정)
- [ ] 온보딩 완료 후 캐릭터 자동 생성 연동 확인

### 알람 정확도 강화
- [ ] `apps/mobile/src/lib/alarmPlayback.ts` — 음성 URL 로딩 로직 정비 (perso.ai 실호출 금지, stub URL 유지)
- [ ] expo-notifications 알람 트리거 정확도 검증 (OS별 제약 확인)
- [ ] 스누즈 후 재알림 타이밍 정확도 검증

### 오프라인 캐싱
- [ ] 음성 파일 로컬 캐싱 로직 검증 (기획서: 오프라인 재생 가능 필수)
- [ ] 알람 목록 오프라인 표시 검증

---

## P5 — UI 폴리시 + 소규모 기능 (P0~P4 완료 후 자동 진행)

> 논의 불필요, 개발 소요 작고, 문제 발생 가능성 낮은 항목만 여기에 둔다.

### 디자인 폴리시
- [ ] 모든 탭 화면에 `SafeAreaView` + 하단 패딩(100px) 일관 적용 검증 — 탭바에 콘텐츠 가려지지 않도록
- [ ] 빈 상태 UI 일관성 점검 — 모든 리스트 화면에 이모지 + 한줄 메시지 + CTA 버튼 패턴 적용
- [ ] 다크모드 전체 화면 검증 — DarkColors 토큰만 사용하고 있는지, 하드코딩 컬러 제거
- [ ] 카드 컴포넌트 스타일 일관성 — `BorderRadius.lg`, `shadow` 토큰, `Spacing.md` 간격 통일
- [ ] 알람 시간 설정 UI 개선 — 시간 피커가 직관적인지, iOS/Android 모두 동작 확인
- [ ] 홈 화면 레이아웃 정리 — 위젯 간 간격, 섹션 구분선, 시각적 위계 정비

### 소규모 기능 구현
- [ ] 앱 스플래시 스크린 설정 — `app.json`의 splash 설정, 코랄 배경 + 앱 로고 텍스트
- [ ] 알람 생성 시 진동 패턴 선택 (기본/강하게/없음) — `expo-haptics` 활용
- [ ] 친구 프로필에 마지막 접속 시간 표시 ("방금 전", "1시간 전" 등)
- [ ] 알람 목록 정렬 — 가장 이른 시간순 (현재 생성순이면 변경)
- [ ] 메시지 라이브러리에서 즐겨찾기 상단 고정
- [ ] 설정 화면에 "앱 정보" 섹션 (버전, 라이선스, 개인정보 처리방침 링크)
- [ ] 초대 코드 공유 시 클립보드 복사 + "복사됨" 토스트

### 접근성 + 국제화 보강
- [ ] 모든 터치 요소에 `accessibilityLabel` 누락 점검 (버튼, 아이콘, 카드)
- [ ] 이모지가 단독으로 정보를 전달하는 곳에 텍스트 라벨 병기 확인
- [ ] 한국어/영어 전환 시 레이아웃 깨짐 없는지 점검 (영어가 한국어보다 길어서 줄바꿈 발생 가능)

---

## 완료 항목 (이전 루프)

<details>
<summary>P0~P39 완료 항목 (39 phases, 모두 완료)</summary>

### P0 (이전) — 선물/친구/상호알람
- [x] 백엔드 Friends 시스템 (DB+API+라우트)
- [x] 백엔드 Gift 시스템 (DB+API+라우트)
- [x] 백엔드 상호 알람 (target_user_id)
- [x] 모바일 앱 UI (friends, gift, alarm 화면)
- [x] 웹 대시보드 UI (FriendsPage, GiftsPage)

### P1~P39 — 테스트/안정화/배포/품질/자가생성
- [x] 입력 validation 강화
- [x] i18n Phase 1-2
- [x] 백엔드 유닛 테스트 (friend/gift/alarm/user/library/voice/tts/stats/middleware)
- [x] ESLint + Prettier 설정 통일
- [x] 관측성 (구조화 로깅, 에러 핸들러)
- [x] 보안 (rate limiting, CORS, bodyLimit)
- [x] 모바일 UX 개선 (스와이프 삭제, 토스트, 검색, pull-to-refresh 등)
- [x] 웹 UX 개선 (스켈레톤, 낙관적 업데이트, 다크모드, 반응형 등)
- [x] 캐릭터 시스템 기본 구현 (seed→sprout→tree→bloom, XP)
- [x] 가족 플랜 (초대코드, 그룹, 가족알람)
- [x] 결제 스텁 (플랜, 구독, 이용권)
- [x] 음성 더빙 (perso.ai 연동)
- [x] 계정 삭제, auth 에러 코드

</details>

## 자가 생성 가능 풀 (BACKLOG 고갈 시)

- 백엔드 테스트 커버리지 확장 (character, family, billing, dub 라우트)
- 모바일 E2E 테스트 (Detox 또는 Maestro)
- 앱 접근성 강화 (스크린 리더, 고대비)
- 성능 프로파일링 + 최적화
- Sentry 에러 모니터링 연동
- 앱 아이콘 + 스플래시 스크린 디자인
- App Store / Google Play 스토어 등록 준비 (메타데이터, 스크린샷)
