# P16 완료 + P17 진행: Dashboard, Stats API, 모바일 홈 통계

## 집은 항목
- P15 마지막: 웹 알람 편집 인라인 UI (스누즈 추가), 대시보드 통계 페이지, 모바일 친구 프로필 TS 수정
- P16: 백엔드 GET /api/stats 엔드포인트, 웹 대시보드 최근 활동 타임라인, 웹 설정 이름 추가
- P17: 모바일 홈탭 요약 통계 카드

## 변경 파일
- `packages/backend/src/routes/stats.ts` — 신규 (GET /api/stats + /api/stats/activity)
- `packages/backend/src/index.ts` — stats 라우트 등록
- `packages/web/src/pages/DashboardPage.tsx` — 신규 대시보드 (통계 + 활동 타임라인)
- `packages/web/src/App.tsx` — 대시보드 탭 추가, 기본 랜딩 변경
- `packages/web/src/services/api.ts` — getStats, getRecentActivity 추가
- `packages/web/src/pages/AlarmsPage.tsx` — 스누즈 편집 슬라이더 + 카드 스누즈 표시
- `packages/web/src/pages/SettingsPage.tsx` — 이름 표시 추가
- `apps/mobile/src/services/api.ts` — getStats 추가
- `apps/mobile/app/(tabs)/index.tsx` — 홈탭 요약 통계 카드
- `apps/mobile/app/friend/[id].tsx` — TS 에러 수정 (colorScheme → Colors.light)

## 검증
- tsc --noEmit: 백엔드/웹/모바일 전부 통과
- npm run build (web): 통과

## 주의사항
- P17 남은 항목: 웹 StatCard 트렌드 표시, 사용자 검색 API + 친구 자동완성
