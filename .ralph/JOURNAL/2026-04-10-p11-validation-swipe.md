---
date: 2026-04-10
slug: p11-validation-swipe
---

# P11 항목 3개 완료 + 기완료 확인 1개

## 집은 BACKLOG 항목
- P11: GiftsPage 낙관적 업데이트, 선물 스켈레톤, alarm 입력 검증, 스와이프 삭제

## 변경 내역

### 1. 웹 GiftsPage 낙관적 업데이트 — 이미 구현 확인
- acceptMutation/rejectMutation에 onMutate/onError/onSettled 패턴 이미 적용됨
- 완료 마킹만 수행

### 2. 모바일 선물 스켈레톤 — 이미 구현 확인
- SkeletonGiftCard, SkeletonGiftList, listWrap/listDimmed 모두 구현 완료
- 완료 마킹만 수행

### 3. 백엔드 alarm 라우트 입력 검증 강화
- alarm.ts POST/PATCH: repeat_days 항목에 `Number.isInteger()` 검증 추가 (소수점 차단)
- alarm.ts POST/PATCH: snooze_minutes에 `Number.isInteger()` 검증 추가
- alarm.ts PATCH: is_active에 `typeof === 'boolean'` 검증 추가
- DELETE: UUID 검증은 이전 루프에서 이미 추가됨, 확인만 수행

### 4. 모바일 알람 스와이프 삭제 제스처
- alarms.tsx: react-native-gesture-handler의 Swipeable 컴포넌트로 알람 카드 래핑
- 오른쪽에서 왼쪽 스와이프 시 빨간 삭제 영역 노출 (animated scale)
- 스와이프 완료 시 기존 handleDelete(confirm 다이얼로그) 호출
- 기존 long-press 삭제도 유지

## 검증 결과
- Backend `npx tsc --noEmit` — 통과
- Mobile `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- P11 전체 완료. 다음 루프에서 P12 신규 항목 생성 필요
