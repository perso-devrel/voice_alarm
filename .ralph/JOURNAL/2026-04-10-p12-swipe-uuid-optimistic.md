---
date: 2026-04-10
slug: p12-swipe-uuid-optimistic
---

# P11 완료 + P12 3/4 완료

## 집은 BACKLOG 항목
- P11: 모바일 알람 스와이프 삭제 (이미 구현됨, 확인만)
- P12: 음성 탭 스와이프 삭제, 백엔드 UUID 검증, 웹 낙관적 업데이트

## 변경 내역

### 1. 모바일 음성 탭 스와이프 삭제 (voices.tsx)
- Swipeable + RNAnimated 임포트 추가
- renderDeleteAction: 스와이프 시 빨간 삭제 버튼 표시 (scale 애니메이션)
- onSwipeableOpen → handleDelete (확인 Alert 후 삭제)
- swipeDeleteContainer/swipeDeleteText 스타일 추가

### 2. 백엔드 UUID 형식 검증 (friend.ts, gift.ts, library.ts)
- 각 라우트에 UUID_RE 추가
- friend: /:id/accept, /:id (DELETE) — 2곳
- gift: /:id/accept, /:id/reject, POST body message_id — 3곳
- library: /:id/favorite — 1곳
- 잘못된 UUID → 400 응답

### 3. 웹 AlarmsPage 낙관적 업데이트
- deleteMutation: onMutate로 목록에서 즉시 제거, onError로 롤백
- toggleMutation: onMutate로 is_active 즉시 토글, onError로 롤백
- onSettled에서 invalidateQueries로 서버 동기화

## 변경 파일
1. apps/mobile/app/(tabs)/voices.tsx — 스와이프 삭제 추가
2. packages/backend/src/routes/friend.ts — UUID 검증 추가
3. packages/backend/src/routes/gift.ts — UUID 검증 추가
4. packages/backend/src/routes/library.ts — UUID 검증 추가
5. packages/web/src/pages/AlarmsPage.tsx — 낙관적 업데이트

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- P12 남은 항목: 모바일 선물 수락 → 알람 설정 바로가기
- P11 알람 스와이프 삭제는 이전 iteration에서 이미 구현되어 있었음 (확인만 함)
