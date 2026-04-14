---
date: 2026-04-10
slug: p23-note-display-alarm-get-voice-detail
---

# P23 전체 완료

## 집은 BACKLOG 항목
- P23: 선물 노트 표시, 알람 단일 조회, 음성 프로필 상세 화면

## 변경 내역

### 1. 모바일: 선물 받은 화면에서 노트 표시
- gift/received.tsx: 이미 구현되어 있음 (line 180: `{item.note && ...}`)

### 2. 웹: GiftsPage에서 보낸 선물에 노트 표시
- GiftsPage.tsx: sent 섹션에 `{g.note && <p>...}` 추가 (received 섹션은 이미 있음)

### 3. 백엔드: GET /api/alarm/:id 단일 알람 조회 엔드포인트
- alarm.ts: GET /:id 엔드포인트 추가 (UUID 검증, 소유자/타겟 확인, JOIN messages + voice_profiles + users)
- 404 시 적절한 에러 응답

### 4. 모바일: 음성 프로필 상세 화면
- voice/detail.tsx: 신규 생성
  - 프로필 헤더 (아바타, 이름, 날짜, 메시지/알람 수 통계)
  - 해당 음성으로 만든 메시지 목록 (voice_profile_id 필터)
  - 해당 음성을 사용하는 알람 목록 (voice_name 매칭)
  - i18n: voiceDetail 섹션 추가 (ko/en)
- voices.tsx: 프로필 카드 탭 시 detail 화면으로 이동 (View → TouchableOpacity)

### 부수 변경 (linter)
- backend tts.ts: GET /messages에 voice_profile_id 쿼리 파라미터 필터 추가
- i18n ko/en: screen.voiceDetail 키 추가

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- P23 전체 완료. P24 생성 필요
- 모바일/웹에서 메시지 삭제 시 409 응답 처리 (confirm dialog) 아직 미구현
