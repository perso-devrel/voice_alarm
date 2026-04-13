---
date: 2026-04-10
slug: p4-eslint-prettier-setup
---

# P4: ESLint + Prettier 설정 통일 (모노레포)

## 집은 BACKLOG 항목
- P4: ESLint + Prettier 설정 통일 (모노레포 루트 + 패키지별)

## 접근
- 기존 상태: ESLint/Prettier 설정 전무, 의존성도 없음
- ESLint flat config (v9) 채택 — 레거시 .eslintrc는 deprecated
- 루트에 공유 설정, 패키지별 오버라이드 (react-hooks for web/mobile, globals for CJS files)

### 설정 구성
1. **`.prettierrc`**: semi, singleQuote, trailingComma:all, printWidth:100, endOfLine:lf
2. **`.prettierignore`**: node_modules, dist, .expo, .wrangler, .ralph
3. **`eslint.config.js`**: typescript-eslint recommended + react-hooks + prettier compat
   - CJS 파일(babel.config.js, metro.config.js)에 node globals 주입
   - `@typescript-eslint/no-unused-vars`: warn (argsIgnorePattern: ^_)
   - `@typescript-eslint/no-explicit-any`: warn
   - `no-console`: warn (allow warn/error)
4. **Root `package.json`**: lint/format 스크립트 + devDependencies 추가

### 코드 정리
- 12개 unused import/variable 경고 수정 (불필요 import 제거, 미사용 변수 _ prefix)
- Prettier 포맷 자동 적용 (VoicesPage.tsx 1건)

## 변경 파일
1. `.prettierrc` — 신규
2. `.prettierignore` — 신규
3. `eslint.config.js` — 신규
4. `package.json` — type:module, lint/format 스크립트, devDependencies
5. `apps/mobile/app/(tabs)/alarms.tsx` — unused useState 제거
6. `apps/mobile/app/(tabs)/voices.tsx` — unused useState 제거
7. `apps/mobile/app/alarm/create.tsx` — unused Platform 제거
8. `apps/mobile/app/player.tsx` — width → _width
9. `apps/mobile/app/voice/diarize.tsx` — unused Audio 제거
10. `apps/mobile/app/voice/record.tsx` — catch(err) → catch
11. `apps/mobile/src/components/LoginButtons.tsx` — unused Platform, Colors 제거
12. `apps/mobile/src/stores/useAppStore.ts` — get → _get
13. `packages/backend/src/index.ts` — unused tts 제거
14. `packages/backend/test/helpers.ts` — unused Hono 제거
15. `packages/web/src/pages/VoicesPage.tsx` — unused diarizeAudio 제거 + prettier

## 검증 결과
- ESLint: 0 errors, 5 warnings (모두 react-hooks/exhaustive-deps — 의도적 mount-only effects)
- Prettier: All matched files use Prettier code style
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과
- Mobile `npx tsc --noEmit` — 통과

## 판단 기록
- exhaustive-deps 5건은 의도적 mount-only useEffect 패턴. 무작정 deps 추가 시 무한 루프 위험 → warn 유지
- endOfLine: "lf" 채택 — Git에서 CRLF 변환 처리하므로 소스는 LF 통일

## 다음 루프
- P4 ESLint + Prettier 완료
- 남은 미완료: P1 테스트 항목(blocked), P4 모바일 오프라인 지원 강화
