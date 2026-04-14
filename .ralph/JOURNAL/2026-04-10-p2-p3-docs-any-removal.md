# 2026-04-10 — P2 CHANGELOG/ARCHITECTURE + P3 웹 any 전면 제거

## 집은 항목
- P2: CHANGELOG.md, ARCHITECTURE.md 신규 작성
- P3: 웹 대시보드 `any` 타입 제거

## 접근
- CHANGELOG: git history + journal 기반으로 Keep a Changelog 형식
- ARCHITECTURE: 전체 코드베이스 탐색 후 ASCII 다이어그램으로 시각화
- Web any 제거: `packages/web/src/types.ts` 신규 생성 (도메인 타입 + getApiErrorMessage 헬퍼), 6개 파일의 19개 `any` → 타입 지정
- LoginPage: `window as any` → `declare const google` 글로벌 타입 선언으로 대체

## 변경 파일
- `CHANGELOG.md` (신규)
- `ARCHITECTURE.md` (신규)
- `packages/web/src/types.ts` (신규)
- `packages/web/src/pages/AlarmsPage.tsx`
- `packages/web/src/pages/FriendsPage.tsx`
- `packages/web/src/pages/GiftsPage.tsx`
- `packages/web/src/pages/MessagesPage.tsx`
- `packages/web/src/pages/VoicesPage.tsx`
- `packages/web/src/components/LoginPage.tsx`
- `apps/mobile/app/voice/record.tsx`
- `apps/mobile/app/voice/upload.tsx`
- `apps/mobile/app/gift/received.tsx`
- `apps/mobile/src/types.ts` (Gift 타입에 sender 필드 추가, getApiErrorMessage 헬퍼 추가)

## 검증 결과
- backend `npx tsc --noEmit` 통과
- mobile `npx tsc --noEmit` 통과
- web `npx tsc --noEmit` 통과
- web `npm run build` 통과 (294KB gzip 91KB)

## 다음 루프
- P3 남은: 의존성 점검, 번들 크기, 코드 중복 제거
- P1: ElevenLabs 음성 테스트 (비용 주의)
