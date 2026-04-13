---
date: 2026-04-10
slug: p20-search-filter-autocomplete
---

# P20: 웹 검색/필터 완성 + 모바일 이메일 자동완성

## 집은 BACKLOG 항목
- P20: GiftsPage 검색/필터, 모바일 친구 이메일 자동완성

## 접근

### 웹 GiftsPage 검색/필터
- 기존에 search/statusFilter state가 있었으나 미사용 → filterGifts 함수 추가
- 받은/보낸 양쪽 모두에 동일 필터 적용
- 상태 필터: 전체/대기/수락/거절
- 검색: 이름, 이메일, 메시지 텍스트, 노트

### 모바일 이메일 자동완성
- api.ts에 searchUsers 함수 추가 (/api/user/search 엔드포인트)
- friends.tsx에 300ms 디바운스 검색 → 드롭다운 표시
- 2글자 이상 입력 시 검색 시작
- 드롭다운에서 선택 시 이메일 자동 채움

## 변경 파일
1. `packages/web/src/pages/AlarmsPage.tsx` — search + active/inactive 필터
2. `packages/web/src/pages/MessagesPage.tsx` — search + category 필터
3. `packages/web/src/pages/VoicesPage.tsx` — search + status 필터
4. `packages/web/src/pages/GiftsPage.tsx` — search + status 필터 (filterGifts 함수)
5. `apps/mobile/src/services/api.ts` — searchUsers 함수 + UserSearchResult 타입 추가
6. `apps/mobile/app/(tabs)/friends.tsx` — 이메일 자동완성 드롭다운 UI

## 검증 결과
- Backend `npx tsc --noEmit` 통과
- Web `npx tsc --noEmit` + `npm run build` 통과
- Mobile `npx tsc --noEmit` 통과

## 다음 루프 주의사항
- P20 남은 항목: 백엔드 message category 필터 쿼리 파라미터
- 모바일 드롭다운 position이 absolute이므로 zIndex 이슈 가능성 있음 (실기기 테스트 필요)
