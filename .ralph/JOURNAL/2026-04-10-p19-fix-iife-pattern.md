# P19 + P20 + P21: IIFE fix, search/filter, dashboard quick actions, gift modal

## BACKLOG 항목
P19: Build was broken (IIFE-in-JSX syntax errors). P20: Add search/filter to remaining web pages.

## 접근

### P19 — IIFE refactor (build fix)
Previous iteration left MessagesPage/VoicesPage with broken IIFE closings. Applied consistent pattern:
- Extract filter logic to `const filteredX = (() => { ... })()` before `return`
- Replace IIFE in JSX with simple ternary: `filteredX.length === 0 ? <empty> : <list>`

### P20 — Search/filter for GiftsPage & FriendsPage
- GiftsPage: search by name/email/message text + status filter (all/pending/accepted/rejected)
- FriendsPage: search by name/email in friend list

## 변경 파일
- `packages/web/src/pages/MessagesPage.tsx` — removed inline IIFE, use existing `filteredMessages` const
- `packages/web/src/pages/VoicesPage.tsx` — added `filteredProfiles` const, removed inline IIFE, search/filter UI
- `packages/web/src/pages/AlarmsPage.tsx` — extracted `filteredAlarms` const (previous loop's uncommitted work)
- `packages/web/src/pages/GiftsPage.tsx` — added search + status filter UI, `filterGifts()` helper
- `packages/web/src/pages/FriendsPage.tsx` — added friend search UI, `filteredFriends` const

## 검증
- ✅ `packages/web` — tsc --noEmit pass, build pass
- ✅ `packages/backend` — tsc --noEmit pass
- ✅ `apps/mobile` — tsc --noEmit pass

### P21 — Dashboard quick actions, gift modal, alarm filter, library category filter
- DashboardPage: Added quick action cards (음성 등록, 메시지 생성, 친구 추가)
- MessagesPage: Replaced `prompt()` gift flow with a proper friend selection modal
- Backend alarm.ts: Added `is_active` query parameter to GET /api/alarm
- Mobile library.tsx: Added horizontal scrollable category filter chips

## 추가 변경 파일
- `packages/web/src/pages/DashboardPage.tsx` — quick action cards
- `packages/web/src/pages/MessagesPage.tsx` — gift modal with friend list
- `packages/backend/src/routes/alarm.ts` — is_active filter parameter
- `apps/mobile/app/(tabs)/library.tsx` — category filter chips

## 검증 (최종)
- ✅ `packages/web` — tsc --noEmit pass, build pass
- ✅ `packages/backend` — tsc --noEmit pass
- ✅ `apps/mobile` — tsc --noEmit pass

## 주의사항
- GiftsPage search/filter state is shared between tabs (by design)
- FriendsPage search only applies to "내 친구" tab, not pending requests
- Gift modal fetches friends via react-query cache (no extra API call)
- Library category filter is client-side only (filters displayItems in memory)
