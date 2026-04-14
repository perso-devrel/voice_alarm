# P22: 모바일 검색 바 + 선물 노트 + 메시지 삭제 경고

## 집은 항목
P22 전체 4개 항목

## 변경 사항

### 1. 모바일: 알람/음성 탭에 검색 바 추가
- `apps/mobile/app/(tabs)/alarms.tsx`: searchQuery 상태 + TextInput + useMemo 필터링 (시간, 음성, 메시지 텍스트)
- `apps/mobile/app/(tabs)/voices.tsx`: searchQuery 상태 + TextInput + useMemo 필터링 (이름)
- `apps/mobile/src/i18n/ko.json`, `en.json`: 검색 placeholder 번역 키 추가

### 2. 웹: 선물 보내기 시 노트 입력 필드 추가
- `packages/web/src/pages/MessagesPage.tsx`: giftNote 상태 + input 필드 추가, sendGift에 note 전달, 모달 닫을 때 초기화

### 3. 모바일: 선물 보내기 시 노트 입력 필드 추가
- 이미 이전 루프에서 Modal + TextInput 기반 UI가 구현됨 (giftModalVisible, giftNote, giftFriends)
- `giftNotePlaceholder` 번역 키만 추가 (ko/en)

### 4. 백엔드: DELETE /api/message/:id 연관 알람 경고
- `packages/backend/src/routes/tts.ts`: 삭제 전 alarms 테이블 조회, 연관 알람 있으면 409 반환 (force=true 쿼리로 강제 삭제 가능)

## 검증
- backend: `npx tsc --noEmit` ✅
- mobile: `npx tsc --noEmit` ✅
- web: `npx tsc --noEmit && npm run build` ✅

## 다음 루프
- P22 완료, P23 생성 필요
