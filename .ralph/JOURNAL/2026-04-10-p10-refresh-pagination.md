---
date: 2026-04-10
slug: p10-refresh-pagination
---

# P10: Pull-to-Refresh + Library Pagination

## 집은 BACKLOG 항목
- 모바일: alarms/voices/library 탭에 pull-to-refresh 추가
- 백엔드: library 엔드포인트에 페이지네이션 추가

## 접근
- Friends/gifts/home 화면은 이미 RefreshControl 있음 → 나머지 3개 탭에 동일 패턴 적용
- alarms, library: FlatList에 refreshControl prop 추가 (isRefetching + refetch)
- voices: FlatList가 scrollEnabled={false}이므로 ScrollView 래퍼에 RefreshControl 적용
- library pagination: friend.ts의 패턴과 동일 (limit/offset, COUNT 병렬 쿼리, total 반환)
- 모바일 getLibrary()는 data.items만 반환하므로 하위호환 유지

## 변경 파일
- apps/mobile/app/(tabs)/alarms.tsx — RefreshControl import + FlatList에 적용
- apps/mobile/app/(tabs)/voices.tsx — ScrollView 래퍼 + RefreshControl
- apps/mobile/app/(tabs)/library.tsx — RefreshControl import + FlatList에 적용
- packages/backend/src/routes/library.ts — limit/offset 파싱, COUNT 쿼리 병렬 실행, total/limit/offset 응답

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- P10 남은 항목: 친구 화면 스켈레톤 UX, 웹 FriendsPage optimistic update
