---
date: 2026-04-10
slug: p18-web-search-filter
---

# P18: 웹 대시보드 검색/필터 기능 추가

## 집은 BACKLOG 항목
- P18: 웹 대시보드 리스트 페이지에 검색 + 필터 UI 추가

## 접근
- 3개 주요 리스트 페이지(AlarmsPage, MessagesPage, VoicesPage)에 검색바 + 상태/카테고리 필터 추가
- 클라이언트 사이드 필터링 (이미 fetch된 데이터 기반, 추가 API 불필요)
- 검색 결과 없을 때 "필터 초기화" 버튼 제공
- IIFE 대신 return 전에 filteredXxx 배열 계산하여 JSX에서 참조 (더 깔끔)

## 변경 파일
1. `packages/web/src/pages/AlarmsPage.tsx` — search + filter (전체/활성/비활성), 시간/음성/메시지 텍스트 검색
2. `packages/web/src/pages/MessagesPage.tsx` — search + filterCategory (전체 + 카테고리별 이모지), 텍스트/음성명 검색
3. `packages/web/src/pages/VoicesPage.tsx` — search + statusFilter (전체/사용가능/생성중/실패), 이름 검색

## 검증 결과
- Backend `npx tsc --noEmit` 통과
- Web `npx tsc --noEmit` + `npm run build` 통과
- Mobile `npx tsc --noEmit` 통과

## 다음 루프 주의사항
- 모바일 앱에도 동일 검색/필터 기능 추가 고려 (alarms, voices 탭)
- GiftsPage, FriendsPage는 이미 탭/검색 있어서 추가 불필요
