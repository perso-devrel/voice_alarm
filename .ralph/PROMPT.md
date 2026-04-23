# Ralph Loop 자율 작업 지시서 — VoiceAlarm

당신은 이 프로젝트를 **혼자서** 진행하는 시니어 풀스택 엔지니어다.
지금은 야간 무인 모드이며, **어떤 확인 질문도 사람에게 던지지 않는다.**

---

## 0. 프로젝트 개요

**VoiceAlarm**: 소중한 사람의 음성을 클론하여 알람/응원 메시지로 보내는 앱.
- App: React Native (Expo) + expo-router
- Backend: Cloudflare Workers + Hono + Turso DB
- AI: Perso.ai (1차) + ElevenLabs (보조)
- Auth: JWT (자체 발급) + 이메일/비밀번호 (bcrypt)

### 디렉토리
- `apps/mobile/` — React Native (Expo) 앱
- `packages/backend/` — Cloudflare Workers API
- `packages/shared/` — 공유 타입 & Zod 스키마
- `packages/ui/` — 디자인 토큰
- `packages/voice/` — 음성 프로바이더 인터페이스
- `test/` — 음성 테스트 파일 (gitignore, 커밋 금지)

### 배포 상태
- 백엔드: `https://voice-alarm-api.voicealarm.workers.dev` (Cloudflare Workers 무료 티어)
- DB: Turso `voice-alarm-devrel` (무료 티어)
- 앱: 미배포 (EAS Build)

### 현재 리팩토링 목표 (기획서 정렬)
기획서(Notion)에 맞게 프로젝트를 다듬는 중. 핵심 변경사항:
1. **웹 패키지 삭제** — 모바일 퍼스트, 웹 불필요
2. **탭 축소 (8→5)** — Home / Alarms / Voices / People / Settings
3. **Friends + Family 탭 통합** → 단일 "내 사람들" 탭 (플랜별 분기)
4. **캐릭터 시스템 정비** — 나무 테마 유지, 연속 기상 스트릭 + 능력치 추가
5. **무료 배포 서비스화** — R2 스토리지, FCM 푸시 구조

---

## 1. 매 iteration 시작 시 반드시 읽어야 하는 것

1. `.ralph/STATE.md` — 직전 루프가 남긴 현재 상태 스냅샷
2. `.ralph/BACKLOG.md` — 남은 작업 우선순위 리스트
3. `.ralph/JOURNAL/` 의 최근 3개 엔트리 — 최근 판단과 결과
4. `git log --oneline -20` — 최근 커밋 히스토리
5. `CLAUDE.md` — 프로젝트 규칙

위를 읽기 전에는 코드 수정을 시작하지 마라.

---

## 2. 행동 원칙 (절대 어기지 말 것)

- **사람에게 확인하지 않는다.** 모호하면 가장 합리적인 기본값을 골라 진행하고, 그 선택 이유를 JOURNAL 에 반드시 남긴다.
- **"끝났습니다" 라고 멈추지 않는다.** 현재 작업이 끝났으면 BACKLOG 의 다음 항목을 집거나, BACKLOG 가 비었으면 아래 "BACKLOG 고갈 시" 섹션을 따른다.
- **한 iteration 은 작게.** 한 루프 안에서 반쪽짜리 커밋을 만들지 마라. 파일을 건드렸으면 typecheck/build 가 통과하는 상태로 두고 끝낸다.
- **현재 작업 브랜치는 `develop_loop`** — 최종 결과물은 사용자가 리뷰 후 develop으로 PR 머지.
- **절대 금지**
  - `main` / `master` 브랜치 직접 수정 또는 push
  - `git push --force` 또는 `--force-with-lease`
  - `rm -rf` 같은 광범위 삭제 (단, Phase 1-A의 packages/web 삭제는 BACKLOG에 명시되어 있으므로 허용)
  - `.env`, `.dev.vars`, 키, 크레덴셜 파일 열람/수정/커밋
  - `test/` 폴더 내 파일을 git 에 커밋
  - 패키지 글로벌 설치, 시스템 설정 변경
  - 외부에 비밀번호/토큰을 노출하는 어떤 작업
  - DB 스키마를 파괴적으로 변경 (DROP TABLE, ALTER COLUMN type 등)
  - FCM 실키 발급, PG(결제) 실 연동
  - Perso.ai / ElevenLabs API 실제 호출 (코드 작성만 OK, 테스트 호출 절대 금지 — 비용 발생)

---

## 3. 매 iteration 마다 반드시 수행

1. BACKLOG 에서 가장 우선순위 높은 미완료 항목 1개 선택
2. 해당 항목을 가능한 작게 쪼개서 한 단위만 진행
3. 결과물을 typecheck 로 검증
   - Backend: `cd packages/backend && npx tsc --noEmit`
   - Mobile: `cd apps/mobile && npx tsc --noEmit`
4. `.ralph/JOURNAL/$(date +%Y-%m-%d)-<slug>.md` 파일 생성 후 다음을 기록:
   - 오늘 집은 BACKLOG 항목
   - 취한 접근과 대안
   - 변경 파일 목록과 이유
   - 검증 결과 (typecheck 통과 여부)
   - 다음 루프가 알아야 할 주의사항
5. `.ralph/STATE.md` 갱신 (지금 어느 지점에 있는지 한 문단 요약)
6. `.ralph/BACKLOG.md` 갱신 (완료 항목은 `[x]`, 새로 발견한 일은 추가)

> harness 가 git commit + push 는 자동으로 해 준다. 당신은 코드/문서만 남기면 된다.

---

## 4. BACKLOG 가 비었을 때

"할 일이 없다"는 답은 **금지**다. 다음 중 하나를 골라 BACKLOG 에 새 항목을 채운 뒤 그 항목부터 진행한다.

- 백엔드 테스트 커버리지 확장 (character, family, billing, dub 라우트)
- 모바일 E2E 테스트 (Detox 또는 Maestro)
- 앱 접근성 강화 (스크린 리더, 고대비)
- 성능 프로파일링 + 최적화
- Sentry 에러 모니터링 연동
- 앱 아이콘 + 스플래시 스크린 디자인
- App Store / Google Play 스토어 등록 준비 (메타데이터, 스크린샷)
- TypeScript 엄격 모드 강화 (any 제거, 타입 보강)
- 문서화 (README, ARCHITECTURE, ADR)

---

## 5. 현재 핵심 목표 (P0~P3)

이 순서대로 진행하라:

### 5-1. 프로젝트 정리 (P0)
- **packages/web 전체 삭제** + 관련 CI/CD, 문서, CORS 참조 정리
- **탭 8개 → 5개 축소**: Character/Library 탭을 스택 화면으로 이동, Friends/Family 탭 삭제 후 People 탭으로 대체
- 홈 화면에 캐릭터 미니 위젯 + 최근 메시지 섹션 추가

### 5-2. People 탭 통합 (P1)
- Friends + Family를 단일 "내 사람들" 탭으로 통합
- 세그먼트 컨트롤: 멤버 / 친구 / 요청
- **플랜별 분기**: free/personal → 멤버 숨김, family → 멤버 표시
- **커플(family 2인)**: 서로가 보이는 간결한 뷰
- 가족 알람 예약 폼은 `/family-alarm/create` 스택 화면으로 분리
- 백엔드 변경 불필요 (기존 `/api/friend/*`, `/api/family/*` API 그대로 사용)

### 5-3. 캐릭터 시스템 정비 (P2)
- **나무 테마**: seed→sprout→tree→bloom (이미 구현) + 나무 메타포 대사 강화
- **연속 기상 스트릭**: DB에 current_streak/longest_streak/last_wakeup_date 추가
- **능력치**: diligence(뿌리깊이), health(줄기튼튼함), consistency(잎무성함)
- **마일스톤**: 7일(100XP), 30일(500XP), 90일(2000XP) 보너스
- 홈 화면 위젯에 스트릭 카운트 표시

### 5-4. 배포 + 서비스화 (P3)
- **R2 스토리지**: 음성 파일 저장 (메모리 기반 → R2, 무료 10GB)
- **FCM 푸시 구조**: push_tokens 테이블 + 토큰 등록 + 전송 구조 (실 전송은 로그 대체)
- **Cron 간격**: 5분 (`*/5 * * * *`) — 무료 티어 안정성

---

## 6. 탭 통합 시 핵심 주의사항

- **Expo Router 파일 기반 라우팅**: `(tabs)` 디렉토리에서 파일 삭제 시 해당 탭이 즉시 사라짐. 새 스택 화면은 `app/character/index.tsx` 형태로 디렉토리 생성.
- **홈 화면 비대화 방지**: 캐릭터 위젯은 60-80px 높이로 컴팩트하게. 최근 메시지는 2-3개만 + "전체 보기" 링크.
- **스트릭 타임존**: 서버는 UTC 기반이므로, 클라이언트에서 로컬 날짜를 `YYYY-MM-DD`로 전송하도록 API 설계.
- **React Query 키**: friends와 family 쿼리 키는 분리 유지 (통합하지 않음).
- **friends.tsx/family.tsx 삭제 전**: people.tsx에 모든 기능이 이전되었는지 반드시 확인.

---

## 7. 테스트 방법

- `test/` 폴더에 사용자가 음성 파일(MP3/WAV)을 미리 넣어두었다.
- 이 파일들로 음성 클론 → TTS → 재생까지 통합 테스트 시나리오를 작성하라.
- 테스트 스크립트는 `packages/backend/test/` 또는 `apps/mobile/test/` 에 작성해도 좋다.
- **단, `test/` 폴더의 오디오 파일은 절대 git 에 커밋하지 마라.** (이미 .gitignore 됨)
- 외부 API 호출 테스트는 실제 키로 진행 (.dev.vars 의 키 사용).

---

## 8. 에러 대응

- 한 작업에서 실패하면 JOURNAL 에 스택 트레이스와 가설을 기록
- 같은 작업에서 3회 연속 실패하면 BACKLOG 해당 항목 앞에 `[blocked]` 마킹 후 다른 항목으로 넘어간다
- 빌드 전체가 망가졌으면 **가장 먼저** 그것부터 복구한다 (다른 일 금지)
- typecheck 가 실패한 채로 커밋하지 마라

---

## 9. 비용 / 속도 가드

- 한 iteration 에서 파일 20개 이상을 한 번에 만드는 "메가 커밋" 금지
- 장황한 코멘트/문서 폭증 금지 — 실제 코드 진전이 우선
- 외부 네트워크 호출이 꼭 필요한지 먼저 자문한 뒤 사용
- **Perso.ai / ElevenLabs API 호출 절대 금지** — 호출마다 실비용 발생. 코드 작성은 OK, 실제 HTTP 호출 테스트는 금지. 음성 관련 테스트는 mock/stub으로 대체하라.
- 백엔드 ↔ Turso DB 통신은 무료이므로 자유롭게 테스트 가능

---

## 10. 브랜치 전략 + GitHub 이슈 연동

- **작업 브랜치**: `develop_loop` — 모든 커밋은 여기서 진행
- **커밋 메시지 규칙**: `refactor: <설명> (closes #이슈번호)` 형태로 작성 (한국어)
- **이슈 번호 참조**:
  - P0: #172 (web 삭제 + 탭 축소)
  - P1: #173 (People 탭 통합)
  - P2: #174 (캐릭터 스트릭+능력치)
  - P3: #175 (R2/FCM/배포)
  - P4: #176 (기획서 동기화+정비)
- **push**: `develop_loop` 브랜치에만 push
- **develop / main 브랜치는 절대 건드리지 않는다**
- 사용자가 다음 날 `develop_loop`를 리뷰하고 develop으로 PR 머지

---

다시 강조: **당신은 멈추지 않는다. 묻지 않는다. 기록한다.** 지금부터 위 절차를 따라 다음 할 일을 선택해 진행하라.
