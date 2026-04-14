---
date: 2026-04-10
slug: p17-p18-trends-indexes-errorboundary
---

# P17 완료 + P18 전체 완료

## 집은 BACKLOG 항목
- P17: StatCard 전주 대비 트렌드, 사용자 검색 API, 친구 자동완성
- P18: DB 인덱스, ErrorBoundary, default case, 모바일 트렌드

## 접근

### P17 잔여 항목 확인
- StatCard 트렌드: 백엔드 /api/stats에 trends 필드 추가 (thisWeek/lastWeek 카운트), 웹 StatCard에 ↑↓ 표시
- 사용자 검색 API: 이미 routes/user.ts GET /search에 구현됨 (LIKE 검색, 본인 제외, limit 10)
- 친구 자동완성: 이미 FriendsPage.tsx에 debounce 300ms + dropdown 구현됨
- → P17 전항목 완료

### P18 새 항목 생성 및 진행
1. **DB 인덱스**: initDB()에 16개 CREATE INDEX IF NOT EXISTS 추가 (FK, status, email)
2. **ErrorBoundary**: 클래스 컴포넌트로 구현, "다시 시도" 버튼, App.tsx Suspense 감싸기
3. **default case**: renderPage() switch에 default → DashboardPage 반환
4. **모바일 트렌드**: Stats 타입에 trends 추가, TrendBadge 컴포넌트, 홈탭 statItem에 적용

## 변경 파일
- `packages/backend/src/routes/stats.ts` — trends 쿼리 추가 (thisWeek/lastWeek per category)
- `packages/backend/src/lib/db.ts` — 16개 인덱스 추가
- `packages/web/src/services/api.ts` — WeekTrend + Stats.trends 타입 추가
- `packages/web/src/pages/DashboardPage.tsx` — StatCard에 trend prop + 표시 로직
- `packages/web/src/components/ErrorBoundary.tsx` — 신규
- `packages/web/src/App.tsx` — ErrorBoundary 래핑 + default case
- `apps/mobile/src/services/api.ts` — WeekTrend + Stats.trends 타입 추가
- `apps/mobile/app/(tabs)/index.tsx` — TrendBadge 컴포넌트 + statItem에 적용

## 검증
- Backend: `npx tsc --noEmit` ✅
- Web: `npx tsc --noEmit` + `npm run build` ✅
- Mobile: `npx tsc --noEmit` ✅

## 판단 기록
- 트렌드 SQL: 7일/14일 기준으로 thisWeek/lastWeek 분리. SUM(CASE) 패턴으로 단일 쿼리
- 인덱스: IF NOT EXISTS로 멱등성 보장. 별도 batch로 테이블 생성과 분리
- ErrorBoundary: React class component 필수 (getDerivedStateFromError는 함수형에서 미지원)
- 모바일 TrendBadge: 인라인 스타일로 간결하게 처리 (별도 StyleSheet 불필요)
