---
date: 2026-04-10
slug: backend-friends-gifts-crossalarm
---

# Backend: Friends + Gifts + Cross-User Alarm 구현

## 집은 BACKLOG 항목
- P0 백엔드 Friends 시스템 (전체)
- P0 백엔드 Gift 시스템 (전체)
- P0 백엔드 상호 알람 Cross-User Alarm (전체)

## 접근
세 기능이 서로 의존적(gift/cross-alarm은 friendship 검증 필요)이므로 한 iteration에 백엔드 전체를 구현.

### 변경 파일
1. `packages/backend/src/lib/db.ts` — `friendships`, `gifts` 테이블 추가, `alarms`에 `target_user_id` 컬럼 추가
2. `packages/backend/src/types.ts` — `Friendship`, `Gift` 인터페이스 추가, `Alarm`에 `target_user_id` 추가
3. `packages/backend/src/routes/friend.ts` — 신규: POST /, GET /list, GET /pending, PATCH /:id/accept, DELETE /:id
4. `packages/backend/src/routes/gift.ts` — 신규: POST /, GET /received, GET /sent, PATCH /:id/accept, PATCH /:id/reject
5. `packages/backend/src/routes/alarm.ts` — target_user_id 지원 (생성 시 친구 검증, 조회 시 본인+타인 알람 반환)
6. `packages/backend/src/index.ts` — friend, gift 라우트 등록

### 설계 결정
- `userId`(OAuth sub = `google_id`)를 friendships/gifts의 FK로 직접 사용 (기존 패턴 따름)
- 이메일 기반 친구 추가: users 테이블에서 email로 검색 → google_id 획득
- 선물 수락 시 자동으로 message_library에 추가 (수락한 메시지를 바로 알람에 사용 가능)
- 자기 자신 친구 요청/선물 방지
- 중복 친구 요청 방지 (양방향 검색)
- 친구 관계 아니면 선물/타인 알람 생성 불가

## 검증 결과
- `npx tsc --noEmit` 통과 (에러 없음)

## 추가 작업 (같은 iteration)

### 모바일 앱 UI
- `app/(tabs)/friends.tsx` — 친구 목록/추가/수락/거절 탭 화면
- `app/gift/received.tsx` — 받은 선물 화면 (수락/거절)
- `app/message/create.tsx` — 생성 완료 후 "🎁 친구에게 선물하기" 버튼 추가
- `app/alarm/create.tsx` — "누구에게?" 친구 선택 추가 (target_user_id)
- `app/(tabs)/_layout.tsx` — 친구 탭 추가 (👥)
- `src/services/api.ts` — Friend/Gift API 함수 추가

### 웹 대시보드 UI
- `src/pages/FriendsPage.tsx` — 친구 관리 페이지
- `src/pages/GiftsPage.tsx` — 받은/보낸 선물 페이지
- `src/pages/MessagesPage.tsx` — 각 메시지에 "🎁 선물" 버튼 추가
- `src/App.tsx` — friends, gifts 페이지 등록
- `src/services/api.ts` — Friend/Gift API 함수 추가

## 검증 결과
- Backend `npx tsc --noEmit` 통과
- Mobile `npx tsc --noEmit` 통과
- Web `npx tsc --noEmit` + `npm run build` 통과 (294KB JS bundle)

## 다음 루프 주의사항
- P0 전체 완료, P1 테스트/안정화로 이동
- DB가 이미 배포된 상태이므로, init-db 엔드포인트 호출 필요 (CREATE TABLE IF NOT EXISTS 이므로 안전)
- 홈 화면에 "받은 선물", "친구 관리" 바로가기가 linter에 의해 추가됨
