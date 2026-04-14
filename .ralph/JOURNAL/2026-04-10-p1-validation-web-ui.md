---
date: 2026-04-10
slug: p1-validation-web-ui
---

# P1: 웹 대시보드 UI + 백엔드 Validation 강화

## 집은 BACKLOG 항목
- P0 웹 대시보드 UI: FriendsPage, GiftsPage, MessagesPage 선물 액션
- P1 백엔드 입력 validation 강화

## 웹 대시보드 변경
- `packages/web/src/pages/FriendsPage.tsx` — 친구 추가/목록/수락/거절
- `packages/web/src/pages/GiftsPage.tsx` — 받은/보낸 선물 (수락/거절)
- `packages/web/src/pages/MessagesPage.tsx` — 각 메시지에 선물 버튼
- `packages/web/src/App.tsx` — friends/gifts 페이지 등록
- `packages/web/src/services/api.ts` — Friend/Gift API 함수 추가

## 백엔드 Validation 변경
- `routes/friend.ts` — 이메일 형식 검증 추가
- `routes/gift.ts` — 이메일 형식 검증 추가
- `routes/voice.ts` — provider 값 검증 ('perso' | 'elevenlabs')
- `routes/alarm.ts` — time 범위, repeat_days 0-6 범위, snooze_minutes 1-30 범위 검증
- `routes/tts.ts` — category 값 검증 (유효 카테고리 목록 체크)

## 검증 결과
- Backend `npx tsc --noEmit` 통과
- Web `npx tsc --noEmit` + `npm run build` 통과
- Mobile `npx tsc --noEmit` 통과

## 설계 결정
- zod 대신 인라인 검증 선택: 의존성 추가 없이 경량 처리. 현재 규모에서 충분.
- 이메일은 간단한 정규식(`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`): 99% 실용적.
