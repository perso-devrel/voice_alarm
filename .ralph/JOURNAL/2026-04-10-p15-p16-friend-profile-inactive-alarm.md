# P15 완료 + P16 시작

## 이번 루프에서 완료한 항목

### P15: 웹 스켈레톤 로딩 UI
- Skeleton.tsx 컴포넌트 5종 (Alarm, Voice, Message, Friend, Gift)
- 5개 페이지 전부 "로딩 중..." → 스켈레톤 교체

### P15: 웹 알람 인라인 편집
- AlarmEditInline 컴포넌트 (시간/반복/메시지/스누즈 편집)
- 알람 카드 클릭 → 인라인 편집 모드, 변경 감지로 불필요 API 호출 방지

### P15: 백엔드 voice 페이지네이션
- GET /api/voice에 limit/offset/total 추가 (다른 라우트와 동일 패턴)

### P15: 모바일 친구 프로필 상세 화면
- friend/[id].tsx 신규: 프로필 카드 + 통계(보낸/받은 선물, 알람 수) + 선물 목록
- ko.json/en.json에 friendProfile 키 추가, common.back 키 추가
- friends 탭에서 카드 탭 → 프로필 화면 이동

### P16: 비활성 알람 시각적 구분 강화
- 시간에 strikethrough, 카운트다운 숨김, voice/message 텍스트도 dim 처리

## 검증
- 전체 typecheck 통과 (web, backend, mobile)
- web build 통과

## 변경 파일 (7개)
- packages/web/src/components/Skeleton.tsx (신규)
- packages/web/src/pages/AlarmsPage.tsx
- packages/web/src/pages/VoicesPage.tsx, MessagesPage.tsx, FriendsPage.tsx, GiftsPage.tsx
- packages/backend/src/routes/voice.ts
- apps/mobile/app/friend/[id].tsx (신규)
- apps/mobile/app/(tabs)/friends.tsx
- apps/mobile/app/(tabs)/alarms.tsx
- apps/mobile/src/i18n/ko.json, en.json
