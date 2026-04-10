# P10: voice ID UUID 검증 + P9 완료 정리

## 이번 루프에서 완료한 것

### P9 잔여 (이전 iter 이어서)
- friend.ts `/pending`에 limit/offset 페이지네이션 추가 (gift.ts는 이전 iter에서 완료)
- settings.tsx에 기본 스누즈 시간 설정 UI 추가 (5/10/15분 칩)
- useAppStore.ts에 `defaultSnoozeMinutes` 상태 + AsyncStorage 영속화
- alarm/create.tsx에서 기본 스누즈를 store에서 가져오도록 수정
- i18n ko/en에 `defaultSnooze`, `minutes` 키 추가
- VoicesPage 음성 테스트 재생 기능은 이미 구현되어 있어서 스킵

### P10 첫 항목
- voice.ts: GET /:id, DELETE /:id에 UUID 형식 검증 추가
- UUID_RE 정규식으로 ID 형식 체크, 실패 시 400 응답

## 검증
- `npx tsc --noEmit` 백엔드/모바일 모두 통과

## 변경 파일
- packages/backend/src/routes/friend.ts — /pending 페이지네이션
- packages/backend/src/routes/voice.ts — UUID 검증
- apps/mobile/src/stores/useAppStore.ts — defaultSnoozeMinutes
- apps/mobile/app/(tabs)/settings.tsx — 스누즈 설정 UI
- apps/mobile/app/alarm/create.tsx — store에서 기본 스누즈 읽기
- apps/mobile/src/i18n/ko.json, en.json — 새 키 추가
