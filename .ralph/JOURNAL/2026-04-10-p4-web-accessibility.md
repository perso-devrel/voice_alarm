---
date: 2026-04-10
slug: p4-web-accessibility
---

# P4: 웹 접근성 — 키보드 네비게이션 + aria-label 보강

## 집은 BACKLOG 항목
- P4: 웹 접근성: 키보드 네비게이션 + aria-label 보강

## 접근
- 기존 상태 확인: App.tsx에 nav aria-label, aria-current, aria-hidden 존재. FriendsPage에 role="tablist", role="tab", aria-selected 존재. AlarmsPage에 toggle/delete aria-label 존재.
- 린터가 일부 자동 적용해줌: GiftsPage tablist/tab/aria-selected, VoicesPage role="status", MessagesPage aria-pressed, SettingsPage aria-current on plan cards, FriendsPage accept/reject aria-labels

### 수동 적용 내역
1. **VoicesPage**: 음성 등록 버튼에 `aria-expanded`, 파일 드롭존에 `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space), 프로바이더 버튼에 `aria-pressed`, 테스트/삭제 버튼에 개별 `aria-label`
2. **MessagesPage**: 탭 버튼에 `role="tablist"` / `role="tab"` / `aria-selected`, 선물 버튼에 `aria-label`
3. **GiftsPage**: 수락/거절 버튼에 sender 이름 포함 `aria-label`
4. **SettingsPage**: 정보 버튼 3개에 `aria-label`, 로그아웃 버튼에 `aria-label`
5. **index.css**: 글로벌 `*:focus-visible` 아웃라인 스타일 추가, `.sr-only` 유틸리티 클래스 추가

## 변경 파일
1. `packages/web/src/pages/VoicesPage.tsx` — aria-expanded, role="button", tabIndex, onKeyDown, aria-pressed, aria-label
2. `packages/web/src/pages/MessagesPage.tsx` — role="tablist", role="tab", aria-selected, aria-label
3. `packages/web/src/pages/GiftsPage.tsx` — aria-label on accept/reject
4. `packages/web/src/pages/SettingsPage.tsx` — aria-label on info/logout buttons
5. `packages/web/src/index.css` — focus-visible outline, sr-only class

## 검증 결과
- Web `npx tsc --noEmit` — 통과
- Web `npm run build` — 통과
- Backend `npx tsc --noEmit` — 통과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프
- P4 웹 접근성 완료
- 남은 P4: 모바일 오프라인 지원 강화 또는 ESLint + Prettier 설정 통일
