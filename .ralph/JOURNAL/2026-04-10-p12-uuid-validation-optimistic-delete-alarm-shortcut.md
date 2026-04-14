---
date: 2026-04-10
slug: p12-uuid-validation-optimistic-delete-alarm-shortcut
---

# P12 — UUID 검증 + 웹 낙관적 삭제 + 선물→알람 바로가기

## 집은 BACKLOG 항목
- P12 전체 4개 항목

## 취한 접근

### 1. 모바일 음성 목록 스와이프 삭제 — 이미 구현됨 (스킵)
- voices.tsx에 이미 Swipeable 패턴 적용 확인

### 2. 백엔드 message 라우트 UUID 형식 검증
- tts.ts: `voice_profile_id`에 UUID_RE 정규식 검증 추가
- gift.ts POST /: `message_id`에 UUID_RE 검증 추가 (기존에 빈 값만 체크)
- gift.ts PATCH /:id/reject: 이미 UUID 검증 있음 확인

### 3. 웹 알람 삭제 낙관적 업데이트 — 이미 구현됨
- AlarmsPage.tsx에 이미 onMutate/onError/onSettled 패턴 적용 확인 (이전 루프에서 자동 적용된 듯)

### 4. 모바일 선물→알람 바로가기
- alarm/create.tsx: `useLocalSearchParams`로 `message_id` 파라미터 수신, 초기 선택 상태로 설정
- gift/received.tsx: accepted 상태의 선물에 "이 메시지로 알람 설정" 버튼 추가
- router.push로 message_id를 params로 전달
- i18n 키 추가: ko "⏰ 이 메시지로 알람 설정", en "⏰ Set as alarm"

## 변경 파일
- packages/backend/src/routes/tts.ts — UUID_RE 상수 + voice_profile_id 검증
- packages/backend/src/routes/gift.ts — message_id UUID 검증
- apps/mobile/app/alarm/create.tsx — useLocalSearchParams로 message_id 수신
- apps/mobile/app/gift/received.tsx — 수락 선물 알람 설정 버튼
- apps/mobile/src/i18n/ko.json — setAsAlarm 키
- apps/mobile/src/i18n/en.json — setAsAlarm 키

## 검증 결과
- Backend tsc --noEmit: 통과
- Mobile tsc --noEmit: 통과
- Web tsc --noEmit + build: 통과

## 다음 루프 주의사항
- P12 전체 완료. P13 신규 항목 생성 필요
