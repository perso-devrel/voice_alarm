# P24 — 음성 상세 모달 + 알람 API 개선

## 선택한 BACKLOG 항목
P24: 4개 항목

## 접근 및 결과

### 1. 모바일/웹: 메시지 삭제 시 409 응답 처리
- 확인 결과, 웹 MessagesPage에 이미 409 핸들링 구현됨 (lines 84-96)
- 409 응답 시 rollback + confirm dialog + force=true 재시도 흐름 완비
- 모바일은 library 삭제 (DELETE /library/:id)로 별도 엔드포인트이므로 409 미해당
- → 완료 처리

### 2. 웹: 음성 프로필 상세 모달
- VoicesPage에 VoiceDetailModal 컴포넌트 추가
- 카드 클릭 → 모달 오픈 (버튼 클릭은 stopPropagation으로 분리)
- 모달: 프로필 헤더 + 메시지/알람 카운트 + 메시지 리스트 + 알람 리스트
- api.ts에 getMessagesByVoice(voiceProfileId) 추가 (voice_profile_id 필터)
- 알람은 기존 getAlarms() 캐시 활용 후 voice_name으로 필터

### 3. 백엔드: GET /api/voice/:id/stats
- voice.ts에 새 엔드포인트 추가
- messages 테이블과 alarms JOIN messages로 카운트 조회
- UUID 검증 + 소유권 검증 포함

### 4. 모바일: 알람 편집 시 GET /api/alarm/:id 활용
- api.ts에 getAlarm(id) 함수 추가
- edit.tsx: getAlarms() → getAlarm(id)로 변경 (전체 목록 대신 단일 조회)
- onSuccess의 syncAlarmNotifications는 여전히 getAlarms() 사용 (전체 목록 필요)

## 변경 파일
- packages/web/src/services/api.ts — getMessagesByVoice 추가
- packages/web/src/pages/VoicesPage.tsx — 카드 클릭 + VoiceDetailModal 컴포넌트
- packages/backend/src/routes/voice.ts — GET /:id/stats 엔드포인트
- apps/mobile/src/services/api.ts — getAlarm(id) 추가
- apps/mobile/app/alarm/edit.tsx — getAlarm 사용으로 리팩터

## 검증
- 백엔드 tsc --noEmit ✅
- 웹 tsc --noEmit + build ✅
- 모바일 tsc --noEmit ✅
