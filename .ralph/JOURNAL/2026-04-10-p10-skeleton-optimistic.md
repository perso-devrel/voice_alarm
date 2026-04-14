---
date: 2026-04-10
slug: p10-skeleton-optimistic
---

# P10: 친구 화면 스켈레톤 로딩 + 웹 낙관적 업데이트

## 집은 BACKLOG 항목
- P10 #2: 모바일 친구 화면 새로고침 중 스켈레톤/딤 로딩 UX 개선
- P10 #3: 백엔드 library 페이지네이션 → 이미 구현되어 있음, 완료 처리
- P10 #4: 웹 FriendsPage 친구 요청 수락/거절 시 낙관적 업데이트

## 변경 파일

### 모바일 (apps/mobile/app/(tabs)/friends.tsx)
- `SkeletonCard` 컴포넌트 추가: Animated pulse 효과로 카드 형태의 스켈레톤 플레이스홀더
- `SkeletonList` 컴포넌트: 초기 로딩 시 ActivityIndicator 대신 스켈레톤 카드 4/3개 표시
- 새로고침 중 기존 리스트에 opacity 0.5 딤 처리 (listDimmed 스타일)
- 스타일 추가: skeletonAvatar, skeletonLine, skeletonName, skeletonEmail, listWrap, listDimmed

### 웹 (packages/web/src/pages/FriendsPage.tsx)
- acceptMutation: onMutate로 pending에서 제거 + friends에 즉시 추가, onError로 롤백, onSettled로 재검증
- removeMutation: onMutate로 friends/pending 양쪽에서 즉시 제거, 동일 롤백/재검증 패턴

### P10 #3 판단
- library.ts를 확인한 결과 limit/offset/total 페이지네이션이 이미 구현되어 있음
- BACKLOG에 완료 처리만 수행

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- P10 전체 완료. 다음 루프에서 P11 신규 항목 생성 필요
