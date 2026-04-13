# P30 + P32 — 메시지 상세 알람 설정 + UI 개선 4건

## 선택한 항목
P30: 웹 메시지 상세 모달 알람 설정
P32: 메시지 검색, voice 삭제 409, 친구 선물 바로가기

## 변경 파일

### packages/web/src/pages/MessagesPage.tsx
- createAlarm 임포트 추가
- alarmMutation + showAlarmForm/alarmTime/alarmRepeatDays 상태 추가
- 상세 모달에 시간 입력 + 반복 요일 선택 + 알람 생성 버튼 UI

### packages/web/src/pages/AlarmsPage.tsx
- AlarmCreateForm: msgSearch 상태 + filteredMsgs 로직 추가
- AlarmEditInline: editMsgSearch 상태 + editFilteredMsgs 로직 추가
- 메시지 3개 초과 시 검색 입력 필드 자동 표시

### packages/backend/src/routes/voice.ts
- DELETE /:id에서 연관 메시지 수 체크 → 409 + message_count 응답
- force=true 쿼리 파라미터로 강제 삭제

### apps/mobile/app/friend/[id].tsx
- "이 친구에게 선물하기" 버튼 추가 (message/create?giftTo= 라우팅)
- giftActionButton 스타일 추가

## 이미 구현 확인된 항목
- P30-2: 모바일 알람 탭→편집 (alarms.tsx:219 onPress)
- P30-3: 백엔드 gift 페이지네이션 JOIN count (gift.ts:97-101)
- P30-4: 모바일 홈 메시지 미리보기 (index.tsx:213)
- P32-1: 모바일 메시지 상세 알람 바로가기 (message/[id].tsx:112)

## 검증 결과
- ✅ 백엔드 typecheck 통과
- ✅ 웹 typecheck + build 통과
- ✅ 모바일 typecheck 통과
