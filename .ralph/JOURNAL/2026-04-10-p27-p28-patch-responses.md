# P25 완료 확인 + P27 진행 + P28 시작

## 선택한 항목
- P25 마지막 항목 (웹 대시보드 음성 모달 연동) — 이미 구현 확인
- P27: MessagesPage 음성 프로필 클릭 모달, voice_profile_id 필터 (이미 구현), 음성 상세 메시지 만들기 바로가기, 테마 영구 저장 (이미 구현)
- P28: VoiceDetailModal 메시지 만들기 버튼, friend list 검색, 홈 탭 선물 배지 (이미 구현)
- 추가: 백엔드 PATCH 응답 개선

## 접근 방식
1. **백엔드 PATCH 응답 개선**: alarm/friend/gift 라우트의 PATCH 엔드포인트가 `{ success: true }` 만 반환 → 업데이트된 객체도 함께 반환하도록 변경. 프론트엔드 낙관적 업데이트 시 서버 상태와 동기화에 유용.
2. **웹 MessagesPage 음성 모달**: voice_name 클릭 → voiceProfiles에서 매칭 → VoiceDetailModal 표시. onCreateMessage 콜백으로 해당 음성으로 메시지 생성 탭 자동 전환.
3. **모바일 message/create voice_id 파라미터**: useLocalSearchParams로 voice_id 받아 selectedVoiceId 초기값으로 설정.
4. **백엔드 friend list 검색**: GET /api/friend/list에 q= 파라미터 추가 (이름/이메일 LIKE 검색).

## 변경 파일
- `packages/backend/src/routes/alarm.ts` — PATCH 응답에 업데이트된 알람 객체 반환
- `packages/backend/src/routes/friend.ts` — PATCH 응답 개선 + GET /list q= 검색 추가
- `packages/backend/src/routes/gift.ts` — PATCH accept/reject 응답에 업데이트된 선물 객체 반환
- `packages/web/src/pages/MessagesPage.tsx` — 음성 이름 클릭 → VoiceDetailModal 연동
- `apps/mobile/app/message/create.tsx` — voice_id 쿼리 파라미터 수신 및 자동 선택

## 검증
- 백엔드: `npx tsc --noEmit` ✅
- 웹: `npx tsc --noEmit` ✅ / `npm run build` ✅
- 모바일: `npx tsc --noEmit` ✅

## 다음 루프
- P28 남은 항목: 선물 보내기 성공 토스트 (Toast 라이브러리 미설치, 현재 Alert 사용 — 토스트 구현 검토 필요)
- 필요 시 P29 생성
