# STRUCTURE_BASELINE — Phase 0 구조 스냅샷

Ralph 루프 시작 시점의 저장소 구조·의존성을 기록한다.
이후 변경 이력은 `PROGRESS.md` 및 각 이슈 PR에서 추적한다.

- 스냅샷 일자: 2026-04-17
- 브랜치: `develop` (commit `de19122`) → `develop_loop` 생성

## 루트

- `package.json` — npm workspaces (`packages/*`), 루트 스크립트 `app/web/backend/lint/format`
- `eslint.config.js`, `.prettierrc` — 루트 일괄 린트/포맷 설정
- `ARCHITECTURE.md`, `CHANGELOG.md`, `README.md`, `CLAUDE.md` — 기존 문서
- `docs/E2E_SCENARIO_GUIDE.md` — 백엔드 E2E 시나리오 가이드
- `.github/workflows/*` — CI/CD (typecheck matrix, deploy-backend, deploy-web)

## apps/mobile (React Native + Expo)

- Expo SDK 54 (`expo ~54.0.33`), React 19.1, React Native 0.81
- expo-router 6, zustand, @tanstack/react-query, i18next
- 인증: `expo-apple-authentication`, `expo-auth-session`, `expo-web-browser`
- 오디오/파일: `expo-av`, `expo-file-system`, `expo-document-picker`
- 주요 경로:
  - `app/(auth)`, `app/(tabs)`, `app/alarm`, `app/dub`, `app/friend`, `app/gift`, `app/message`, `app/voice`
  - `src/components`, `src/services`, `src/stores`, `src/hooks`, `src/i18n`, `src/utils`

## packages/backend (Cloudflare Workers + Hono)

- hono 4, @libsql/client 0.17 (Turso), wrangler 4, vitest 4
- 주요 경로:
  - `src/index.ts` — Hono 앱 엔트리
  - `src/routes/` — `user`, `voice`, `tts`, `alarm`, `friend`, `gift`, `library`, `stats`, `dub`
  - `src/lib/` — `db` (스키마 포함), `perso`, `elevenlabs`
  - `src/middleware/auth.ts` — Google/Apple 토큰 검증
  - `test/` — route 별 통합 테스트 (8개)

## packages/web (React + Vite + Tailwind)

- React 19.2, Vite 8, Tailwind 4, axios, @tanstack/react-query
- 주요 경로: `src/pages`, `src/components`, `src/hooks`, `src/services`

## 아직 없음 (향후 이슈로 만들어질 대상)

- `packages/shared` — 공용 타입/스키마 (Phase 1 #3)
- `packages/voice` — `VoiceProvider` 어댑터 (Phase 3 #12)
- `packages/ui` — 공용 디자인 토큰 (Phase 8 #46)
- 루트 통합 테스트 러너 (Phase 1 #5)
- `PROGRESS.md` 자동 요약/비상 로그 (이 이슈에서 초기화)

## gitignore에서 커밋 금지 대상

`.env`, `.dev.vars`, `ios/`, `android/`, `dist/`, `.expo/`, `.wrangler/`, `test/*`(고정 샘플 제외).
민감 파일은 `.gitignore` 에 이미 포함되어 있으므로 루프 중 추가 금지 파일이 생기면 즉시 .gitignore 보강 후 작업.
