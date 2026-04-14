# P23 — Voice Profile Detail + API Filter

## 작업 항목
P23 전체 (4개 항목)

## 결과
- P23-1 (모바일 선물 노트 표시): 이미 구현됨 (received.tsx:180)
- P23-2 (웹 선물 노트 표시): 이미 구현됨 (GiftsPage.tsx:190, 255)
- P23-3 (GET /api/alarm/:id): 이미 구현됨 (alarm.ts:49)
- P23-4 (음성 프로필 상세 화면): 신규 구현

## 변경 파일
- `packages/backend/src/routes/tts.ts` — GET /api/tts/messages에 voice_profile_id 쿼리 파라미터 추가
- `apps/mobile/src/services/api.ts` — getMessagesByVoice() 함수 추가
- `apps/mobile/app/voice/[id].tsx` — 음성 프로필 상세 화면 신규 (프로필 정보, 메시지 목록, 알람 목록)
- `apps/mobile/app/(tabs)/voices.tsx` — 카드 탭 시 상세 화면으로 이동 (경로 수정)
- `apps/mobile/app/_layout.tsx` — voice/[id] 스크린 등록
- `apps/mobile/src/i18n/ko.json` — screen.voiceDetail 키 추가
- `apps/mobile/src/i18n/en.json` — screen.voiceDetail 키 추가

## 검증
- 백엔드: tsc --noEmit ✅
- 모바일: tsc --noEmit ✅
- 웹: tsc --noEmit + build ✅

## 다음 루프 참고
- P23 전체 완료. BACKLOG 비었으므로 새 항목 생성 필요.
