---
date: 2026-04-10
slug: p6-web-darkmode
---

# P6: 웹 다크모드 지원 (gradient 마무리)

## 집은 BACKLOG 항목
- P6: 웹 다크모드 지원 (prefers-color-scheme + 수동 토글)

## 접근

이미 대부분의 인프라가 구축되어 있었음:
- `useDarkMode.ts` 훅: localStorage 저장 + system preference 감지 + `<html>` class toggle
- `index.css`: CSS 변수 `:root` (라이트) + `.dark` (다크) 정의
- `@custom-variant dark` (Tailwind v4): `dark:` prefix 지원
- `SettingsPage`: 시스템/라이트/다크 3모드 토글 UI

동시에 실행된 다른 루프가 6개 페이지 컴포넌트(VoicesPage, MessagesPage, AlarmsPage, FriendsPage, GiftsPage, LoginPage)의 hardcoded 색상을 CSS 변수로 전환 완료.

이번 루프에서 남은 작업:
- `index.css`의 `.gradient-primary` 클래스가 hardcoded hex를 사용하고 있어서 CSS 변수 기반으로 수정
- `.dark .gradient-primary` 추가: 다크모드에서 더 어두운 gradient 적용

## 변경 파일
1. `packages/web/src/index.css` — gradient-primary 다크모드 대응

## 검증 결과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- P6 전체 완료. BACKLOG 자가 생성 풀에서 새 항목을 골라야 함
- 남은 미완: P1 ElevenLabs 테스트 (blocked), Perso API 404 (blocked)
- 자가 생성 풀 후보: Sentry 연동, 성능 프로파일링, 추가 리팩터
