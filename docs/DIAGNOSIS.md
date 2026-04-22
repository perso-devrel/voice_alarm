# DIAGNOSIS — 기존 코드 진단 리포트

- 진단일: 2026-04-17
- 범위: `apps/mobile`, `packages/backend`, `packages/web` + 루트
- 목적: Ralph 루프 진입 전, 기존 자산과 리스크를 파악하여 이후 이슈 계획의 근거로 삼는다.

## 1. 한 줄 요약

이미 MVP 수준의 풀스택 코드가 동작한다. 음성 클론·TTS·알람·친구·선물까지 엔드투엔드로 연결되어 있고, 루프의 역할은 **"새 기능 추가(이용권·가족 플랜·게이미피케이션)"** 와 **"mock 기반 안정화/문서화"** 에 가깝다. 처음부터 만드는 상황이 아님.

## 2. 현재 자산 요약

### 백엔드 (`packages/backend`)

- Hono 라우트: `user`, `voice`, `tts`, `alarm`, `friend`, `gift`, `library`, `stats`, `dub`
- Turso(LibSQL) 스키마에 `users`, `voice_profiles`, `messages`, `message_library`, `alarms`, `friendships`, `gifts` 존재 (ARCHITECTURE.md 참조)
- 인증: Google OAuth tokeninfo 검증 + Apple JWT 디코딩 (JWKS 서명검증은 TODO)
- 외부 연동: `lib/perso.ts`, `lib/elevenlabs.ts` 구현됨 → **실호출은 루프 중 금지**
- 테스트: `test/*.test.ts`, `src/routes/*.test.ts` 합계 8~9개 파일, vitest

### 모바일 (`apps/mobile`)

- expo-router 기반, `(auth)` / `(tabs)` / `alarm` / `message` / `voice` / `friend` / `gift` / `dub` 화면 구현
- 상태관리: zustand + @tanstack/react-query
- i18n: i18next (한/영)
- 오디오 재생: expo-av, 로컬 파일: expo-file-system

### 웹 (`packages/web`)

- Vite + Tailwind 4, `pages/Dashboard|Alarms|Voices|Messages|Friends|Gifts|Settings`
- axios 기반 API 클라이언트, @tanstack/react-query

## 3. TODO/FIXME 수집

- `grep -R "TODO\|FIXME\|NEEDS_VERIFICATION"` 결과: 소스(`*.ts`, `*.tsx`) 기준 0건
- ARCHITECTURE.md 내 "JWKS 서명 검증 필요" 주석만 존재 → 인증 보안 하드닝 후보
- Ralph 루프에서 mock 주석(`// TODO: real perso.ai integration` 등)을 **새로 심을 때** 반드시 이 형식을 쓰도록 한다.

## 4. 리스크 / 주의점

1. **기존 외부 AI 클라이언트가 실호출 형태** — `lib/perso.ts`, `lib/elevenlabs.ts` 를 직접 사용하는 경로가 있으면, 새 기능 추가 시 **mock 래퍼로 감싸고** 실호출을 피해야 한다. (Phase 3 #12 에서 `VoiceProvider` 인터페이스로 추상화 예정.)
2. **결제 실연동 위험** — `RevenueCat (예정)` 이 README 에 있다. 루프 중 `Stripe/토스페이먼츠/RevenueCat` 관련 코드를 추가하지 않고, 스텁 엔드포인트만 만든다 (Phase 5).
3. **알람 실행 경로** — 현재 백엔드에는 알람 스케줄러가 없고, 모바일이 `expo-notifications` 로 로컬 스케줄링을 하는 것으로 보인다. "백엔드 주도 알람" 은 Phase 4 #21 에서 in-memory 스케줄러로 추가 예정. FCM 실연동은 TODO.
4. **DB 스키마 변경 리스크** — `users` 에 `name`, `picture`, `firebase_uid` 를 add 한 hotfix 마이그레이션(최근 커밋 `919d114`, `de19122`) 이 존재. 새 모델(Subscription, FamilyGroup, Character 등) 추가 시 기존 데이터 파괴 없이 `IF NOT EXISTS` 패턴 유지 필요.
5. **테스트 범위** — 라우트별 단위는 있으나 플랜/가족/게임 기능은 전혀 없음. 새 기능마다 최소 1개 이상의 vitest 케이스 추가 원칙 준수.
6. **큰 파일** — `apps/mobile/app/(tabs)/*`, `app/alarm/create.tsx`, `app/message/create.tsx` 가 500~700 라인. 새 기능 끼워 넣을 때 파일 분리 기회가 있으면 Phase 10 에서 후보로.

## 5. 루프 진행에 미치는 영향

- **Phase 1 #1~#6 재해석**
  - #1 (이 문서)
  - #2 (모노레포 구조 확정) → ADR-001 에 근거하여 **현재 구조 유지**. 별도 이동 작업 없음. 이슈는 "구조 유지 결정 문서화 + `packages/shared` 스캐폴드" 로 축소 가능.
  - #3 (`packages/shared`) → zod 스키마 모듈 신규 생성
  - #4 (lint/format/typecheck) → 루트 `lint` 는 있고 `typecheck` 스크립트는 각 워크스페이스에만 존재. 루트 `typecheck` 집계 스크립트 추가 필요.
  - #5 (테스트 러너) → backend 는 vitest 있음. web/mobile 러너 부재 → 최소 1개씩.
  - #6 (CI 초안) → `.github/workflows` 에 이미 존재. `develop_loop` PR 대상으로 동일 워크플로우 확장.

- **Phase 2 인증** — 이미 Google/Apple 토큰 검증이 있으므로 TASK.md 의 "이메일+비밀번호+JWT" 계획 대신 **기존 OAuth 유지 + 가족 초대 플로우에 필요한 내부 세션 정보만 추가** 하는 방향으로 전개 (Phase 5 #32 와 중복 최소화).

- **Phase 3~9** — ADR-005 에 따라 모든 외부 서비스는 mock 어댑터로만 구현.

## 6. 다음 작업

- Issue #15 머지 후 Issue #16 "모노레포 구조 결정 문서화 + `packages/shared` 스캐폴드" 진행 (TASK.md Phase 1 #2/#3 병합 축소).
