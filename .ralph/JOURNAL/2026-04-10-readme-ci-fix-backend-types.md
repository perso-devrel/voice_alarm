---
date: 2026-04-10
slug: readme-ci-fix-backend-types
---

# P2: README + CI 워크플로우 수정 + P3: 백엔드 any 제거

## 집은 BACKLOG 항목
- P2: README 갱신
- P2: 배포 워크플로우 동작 확인 (CI fix)
- P3: TypeScript strict 모드 위반 (any) 점검 — 백엔드

## 접근

### README
- 프로젝트 구조, 기술 스택, 시작하기, 배포, API 엔드포인트, 핵심 기능 정리
- `.env.example` 기반 환경변수 문서화

### CI 워크플로우 버그 발견 및 수정
- `deploy-backend.yml`, `deploy-web.yml`: `cache-dependency-path`가 `packages/*/package-lock.json`을 참조했으나 실제 lock 파일은 루트에만 존재
- `ci.yml`: npm 캐시 설정 누락
- 3개 워크플로우 모두 루트 `package-lock.json` 참조 + 루트에서 `npm install` 실행하도록 수정

### 백엔드 any 제거
- `types.ts`에 `AuthVariables` + `AppEnv` 타입 추가
- 8개 파일 (auth.ts + 7개 routes) 에서 `(c as any).set/get` → 타입 안전한 `c.set/get`
- `gift.ts`의 `areFriends(db: any, ...)` → `Client` 타입으로 교체
- `auth.ts`의 `decodeJwtPayload` 반환형 `any` → `TokenPayload`
- `verifyGoogleToken`의 `payload: any` → `TokenPayload`

## 변경 파일
1. `README.md` — 신규
2. `.github/workflows/deploy-backend.yml` — cache path + install working-directory 수정
3. `.github/workflows/deploy-web.yml` — 동일 수정
4. `.github/workflows/ci.yml` — npm cache 추가 + install working-directory 수정
5. `packages/backend/src/types.ts` — `AuthVariables`, `AppEnv` 타입 추가
6. `packages/backend/src/middleware/auth.ts` — `AppEnv` 적용, `any` 5개 제거
7. `packages/backend/src/routes/user.ts` — `AppEnv` 적용, `(c as any)` 5개 제거
8. `packages/backend/src/routes/alarm.ts` — `AppEnv` 적용
9. `packages/backend/src/routes/friend.ts` — `AppEnv` 적용
10. `packages/backend/src/routes/gift.ts` — `AppEnv` 적용, `db: any` → `Client`
11. `packages/backend/src/routes/library.ts` — `AppEnv` 적용
12. `packages/backend/src/routes/tts.ts` — `AppEnv` 적용
13. `packages/backend/src/routes/voice.ts` — `AppEnv` 적용
14. `packages/backend/src/index.ts` — `api` Hono에 `AppEnv` 적용

## 검증 결과
- Backend `npx tsc --noEmit` 통과 (any 0개)
- Web `npx tsc --noEmit` + `npm run build` 통과
- Mobile 변경 없음

## 다음 루프 주의사항
- 모바일/웹의 `any` 제거는 별도 항목으로 분리함
- CI 워크플로우 수정은 develop push 시 GitHub Actions에서 검증 필요
