# 2026-04-10 — P0 완료 확인 + alarm/create 버그 수정

## 집은 항목
P0 모바일 앱 UI (잔여 항목 확인 및 버그 수정)

## 발견 사항
- friends.tsx, gift/received.tsx, message/create.tsx (선물 버튼), alarm/create.tsx (누구에게?) 모두 이전 루프에서 이미 구현되어 있었음
- 웹 대시보드도 FriendsPage, GiftsPage, MessagesPage 선물 버튼 모두 완료 상태

## 수정 내용
1. **alarm/create.tsx 버그 수정**: 친구 선택 시 friend ID 해석 로직이 잘못됨
   - 기존: `f.user_a === f.user_b ? f.user_b : (f.friend_email ? f.user_b : f.user_a)` — 의미 없는 조건
   - 수정: `f.user_a === userId ? f.user_b : f.user_a` — 현재 사용자 ID 기반으로 정확히 상대방 ID 추출
   - `useAppStore`에서 `userId`를 가져와 사용

2. **홈 화면 퀵 액션 추가**: index.tsx에 "받은 선물" (gift/received)과 "친구 관리" (friends 탭) 바로가기 추가

## 변경 파일
- `apps/mobile/app/alarm/create.tsx` — 친구 ID 해석 버그 수정
- `apps/mobile/app/(tabs)/index.tsx` — 퀵 액션 2개 추가
- `.ralph/BACKLOG.md` — P0 모바일/웹 항목 모두 [x] 체크
- `.ralph/STATE.md` — 현재 상태 갱신

## 검증
- `npx tsc --noEmit` 통과: backend, mobile, web 전부

## 다음 루프 주의사항
- P0 완료. P1 시작 — 백엔드 validation 강화가 좋은 첫 항목
- Perso API 404 이슈는 실제 API 문서 확인 없이는 해결 불가 — 건너뛰고 다른 항목 진행 권장
