---
date: 2026-04-10
slug: p21-quickaction-modal-category
---

# P21: 대시보드 퀵 액션 + 선물 모달 + 라이브러리 카테고리 필터

## 집은 BACKLOG 항목
- P21 전체: 대시보드 퀵 액션, 선물 모달, alarm is_active 서버 필터(이미 구현), 라이브러리 카테고리 필터

## 접근
- 대시보드 퀵 액션: 3개 버튼(음성 등록/메시지 생성/친구 추가) → onNavigate로 해당 페이지 이동
- 선물 모달: prompt() → fixed overlay + 친구 목록 카드형 선택 → handleGiftSend 호출
- alarm is_active: 이미 GET /api/alarm에 is_active 쿼리 파라미터 구현됨 (확인만)
- 라이브러리 카테고리: CATEGORIES 상수 + categoryFilter state + 가로 스크롤 칩 → displayItems 필터링 (이미 로직 존재, UI만 추가)

## 변경 파일
1. `packages/web/src/pages/DashboardPage.tsx` — 퀵 액션 카드 3개 추가
2. `packages/web/src/pages/MessagesPage.tsx` — giftTarget state + handleGiftSend + 친구 선택 모달 UI
3. `apps/mobile/app/(tabs)/library.tsx` — 카테고리 필터 FlatList (horizontal 칩)
4. `apps/mobile/src/services/api.ts` — searchUsers + UserSearchResult 타입
5. `apps/mobile/app/(tabs)/friends.tsx` — 이메일 자동완성 드롭다운

## 검증 결과
- Backend/Web/Mobile 모두 `npx tsc --noEmit` 통과
- Web `npm run build` 통과

## 다음 루프 주의사항
- P22 생성됨: 모바일 알람/음성 검색, 선물 노트 입력, 연관 알람 경고
