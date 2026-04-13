---
date: 2026-04-10
slug: p13-gift-optimistic
---

# P13: 모바일 선물 수락/거절 낙관적 업데이트

## 집은 BACKLOG 항목
- P12 마지막: 선물 → 알람 바로가기 (이전 루프에서 이미 구현 확인)
- P13 신규: 선물 수락/거절 낙관적 업데이트

## 취한 접근
- 웹 GiftsPage가 이미 낙관적 업데이트를 사용 중 → 동일 패턴을 모바일에 적용
- accept mutation: onMutate에서 status → 'accepted' 즉시 반영, onError에서 롤백
- reject mutation: onMutate에서 status → 'rejected' 즉시 반영, onError에서 롤백
- 수락 성공 Alert 개선: 기존 단순 "확인" → "확인" + "알람으로 설정" 2버튼 제공
  - message_id를 가지고 /alarm/create로 바로 이동 가능

## 변경 파일
- apps/mobile/app/gift/received.tsx: Gift 타입 import, accept/reject 낙관적 업데이트, 수락 Alert 개선

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- P13 다음 항목: 라이브러리 탭 스와이프 삭제
