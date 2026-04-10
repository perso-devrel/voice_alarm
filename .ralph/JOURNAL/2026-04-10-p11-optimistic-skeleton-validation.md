---
date: 2026-04-10
slug: p11-optimistic-skeleton-validation
---

# P11 항목 3개 완료

## 집은 BACKLOG 항목
- P11: 웹 GiftsPage 낙관적 업데이트, 모바일 선물 스켈레톤, 백엔드 알람 입력 검증

## 변경 내역

### 1. 웹 GiftsPage 낙관적 업데이트
- GiftsPage.tsx: acceptMutation/rejectMutation에 onMutate 추가
- 수락 시 즉시 status='accepted', 거절 시 status='rejected'로 UI 반영
- onError에서 이전 캐시 복원 (롤백), onSettled에서 invalidateQueries

### 2. 모바일 gift/received 스켈레톤 로딩
- received.tsx: SkeletonGiftCard 컴포넌트 (pulse 애니메이션)
- ActivityIndicator → SkeletonGiftList(count=3) 교체
- isRefetching 시 listDimmed (opacity 0.5) 적용

### 3. 백엔드 alarm 입력 검증 강화
- alarm.ts: UUID_RE 추가
- POST: message_id UUID 형식 검증 추가
- PATCH /:id: id UUID 형식 + message_id UUID 검증
- DELETE /:id: id UUID 형식 검증

## 검증 결과
- Web `npx tsc --noEmit` + `npm run build` — 통과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- P11 남은 항목 1개: 모바일 알람 스와이프 삭제 (react-native-gesture-handler 필요 여부 확인)
