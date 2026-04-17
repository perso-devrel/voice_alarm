# ARCHITECTURE_DECISION — Phase 0 결정 기록

Ralph 루프 시작 시점에서 모노레포 구조와 기술 스택에 대해 내린 결정을 기록한다.
형식은 가벼운 ADR(Architecture Decision Record).

## ADR-001 · 모노레포 구조: 기존 구조 유지

- 상태: Accepted · 2026-04-17
- 맥락
  - TASK.md는 `apps/web`, `apps/mobile`, `apps/backend`, `packages/shared` 를 권장한다.
  - 현재 저장소는 `apps/mobile`, `packages/backend`, `packages/web` 로 이미 상당한 코드가 작성되어 있다.
  - TASK.md §10: "기존 코드가 이미 다른 스택이면 기존 스택 유지하고 monorepo 재편은 Phase 1 이슈로 따로 제안만."
- 결정
  - 기존 경로(`apps/mobile`, `packages/backend`, `packages/web`) 를 유지한다.
  - 구조 재편은 하지 않고 공용 패키지(`packages/shared`, `packages/voice`, `packages/ui`) 만 필요한 시점에 추가한다.
- 근거
  - 이미 CI, 배포, 테스트 경로, README, ARCHITECTURE.md 가 모두 현재 경로에 고정되어 있어 재편 비용이 크다.
  - 루프가 목표로 하는 기능 추가(이용권·가족 플랜·게이미피케이션 등) 에는 구조 재편이 필수적이지 않다.
- 후속 작업
  - 공용 타입 모듈이 필요해지면 `packages/shared` 를 추가한다 (TASK.md Phase 1 #3 수준의 zod 스키마 포함).
  - 음성 어댑터는 `packages/voice` 로 추출한다 (Phase 3 #12).

## ADR-002 · 백엔드 런타임: Cloudflare Workers + Hono 유지

- 상태: Accepted · 2026-04-17
- 맥락
  - TASK.md는 Fastify + Prisma + zod 를 추천한다.
  - 현재는 Cloudflare Workers + Hono + @libsql/client (Turso) 구성이며 배포 파이프라인까지 작동 중이다.
- 결정
  - 기존 스택(Workers + Hono + Turso) 유지.
  - Prisma 대신 Turso/LibSQL 의 `db.execute` 를 계속 사용한다.
- 근거
  - Workers 런타임은 Node.js 전제의 Fastify/Prisma 를 그대로 올릴 수 없고, 재구성 시 현재 머지된 모든 라우트·테스트를 재작성해야 한다.
  - 기존 테스트 러너가 이미 vitest 로 구성되어 있어 신규 테스트 추가 비용이 낮다.
- 리스크 / 후속
  - 스키마 마이그레이션은 현재 수동 SQL 이다. 이후 Phase 10 개선 후보로 `migrations/*.sql` + 실행 도구 도입을 고려.

## ADR-003 · 모바일 스택: React Native + Expo 유지

- 상태: Accepted · 2026-04-17
- 결정
  - 기존 Expo 프로젝트(SDK 54, expo-router) 를 유지한다.
  - 새 화면은 expo-router 규약(`app/**/*.tsx`) 을 따른다.
- 근거
  - 이미 onboarding, 알람, 친구, 선물, 음성, 더빙 등 주요 플로우가 expo-router 로 구현되어 있다.
  - TypeScript 공유가 가능해 `packages/shared` 도입 시 그대로 재사용할 수 있다.

## ADR-004 · 웹 스택: React + Vite + Tailwind 유지

- 상태: Accepted · 2026-04-17
- 결정
  - Next.js 로 이전하지 않고 Vite 기반 SPA 를 유지한다.
- 근거
  - 현재 웹은 백엔드 API 를 호출하는 대시보드 성격이라 SSR 요구가 없다.
  - 기존 페이지 구조(`src/pages/*`) 와 axios 기반 서비스가 그대로 재사용 가능하다.

## ADR-005 · 외부 AI·결제·푸시는 Mock 어댑터로 대체

- 상태: Accepted · 2026-04-17
- 결정
  - Perso.ai, ElevenLabs, 결제 PG, FCM/APNs 는 Ralph 루프 동안 실호출하지 않는다.
  - 각 어댑터는 mock 응답을 반환하고, 교체 지점마다 `// TODO: real {perso.ai|elevenlabs|pg|fcm} integration` 주석을 남긴다.
- 근거
  - TASK.md §"절대 금지 사항" 과 직접 대응. 크레딧·과금·사용자 데이터 리스크를 방지한다.
- 후속
  - 실호출 복귀 시 `grep -R "TODO: real"` 으로 교체 지점을 찾아 일괄 연결한다.
