# P15: 웹 스켈레톤 로딩 UI

## 집은 항목
P15 첫 항목 — 웹 전체 페이지 스켈레톤 로딩 UI

## 접근
기존 "로딩 중..." 텍스트를 실제 컨텐츠 레이아웃을 모방하는 pulse 애니메이션 스켈레톤으로 교체.
Tailwind의 `animate-pulse` 활용. 각 페이지 데이터 형태에 맞는 개별 스켈레톤 제공.

## 변경 파일
- `packages/web/src/components/Skeleton.tsx` (신규) — AlarmSkeleton, VoiceCardSkeleton, MessageSkeleton, FriendSkeleton, GiftSkeleton
- `packages/web/src/pages/AlarmsPage.tsx` — 스켈레톤 import + 적용
- `packages/web/src/pages/VoicesPage.tsx` — 동일
- `packages/web/src/pages/MessagesPage.tsx` — 동일
- `packages/web/src/pages/FriendsPage.tsx` — 동일
- `packages/web/src/pages/GiftsPage.tsx` — received/sent 양쪽 모두

## P14 최종 항목
웹 알람 프리셋은 이미 AlarmCreateForm에 구현되어 있었음 (voice 선택 + category + preset messages + TTS 생성). 완료 마킹만 처리.

## 검증
- `npx tsc --noEmit` 통과 (web, backend, mobile 전부)
- `npm run build` 통과 (292ms)
- "로딩 중..." 텍스트 웹 전체에서 제거 확인 (grep 결과 0건)

## 다음 루프 주의사항
- P15 나머지 항목 중 "모바일 알람 상세 편집"이 가장 우선
- Skeleton 컴포넌트의 CSS 변수 (`--color-surface-alt`)는 다크모드에서도 동작 확인 필요 (이미 테마 시스템에 정의됨)
