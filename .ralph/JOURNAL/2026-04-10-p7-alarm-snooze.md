---
date: 2026-04-10
slug: p7-alarm-snooze
---

# P7: 알람 스누즈 동작 구현

## 집은 BACKLOG 항목
- P7: 모바일 알람 스누즈 동작 구현 (알림에서 스누즈 액션 → N분 후 재알림)

## 접근

기존 상태: alarm create UI에서 스누즈 시간(5/10/15분) 선택 가능, `snooze_minutes`가 DB에 저장됨. 하지만 실제 알림에서 스누즈 버튼이 없고, 스누즈 동작도 없었음.

구현:
1. **Notification Category 등록**: `alarm` 카테고리에 "😴 스누즈"와 "✓ 끄기" 두 액션 버튼 등록 (`setNotificationCategoryAsync`)
2. **알림 data에 snoozeMinutes 추가**: 각 알람의 `snooze_minutes` 값을 알림 data에 포함
3. **알림에 categoryIdentifier 설정**: daily/weekly 트리거 모두 `alarm` 카테고리 적용
4. **스누즈 스케줄링 함수**: `scheduleSnoozeNotification()` — `TIME_INTERVAL` 트리거로 N분 후 동일 내용 재알림 (카테고리 포함하여 연속 스누즈 가능)
5. **_layout.tsx 응답 리스너 확장**: `SNOOZE_ACTION` 감지 시 `scheduleSnoozeNotification` 호출, 앱을 포그라운드로 올리지 않음 (`opensAppToForeground: false`)

대안 검토:
- Background task로 스누즈 처리하는 방식 — 불필요하게 복잡. expo-notifications의 TIME_INTERVAL 트리거가 가장 단순하고 신뢰성 높음.

## 변경 파일
1. `apps/mobile/src/services/notifications.ts` — 카테고리 등록, snoozeMinutes data 추가, categoryIdentifier 설정, scheduleSnoozeNotification 함수 추가
2. `apps/mobile/app/_layout.tsx` — 스누즈 액션 핸들링 로직 추가

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- 스누즈 버튼 텍스트가 한국어 하드코딩("😴 스누즈", "✓ 끄기"). `setNotificationCategoryAsync`는 i18n 제공 시점에 호출되므로 동적 변환이 가능하지만, 현재는 모듈 로드 시점에 실행됨. 필요 시 앱 초기화 후 언어에 따라 재등록 가능.
- iOS에서 카테고리 액션은 잠금 화면에서도 동작. Android는 채널 설정과 함께 동작.
- 연속 스누즈 가능 (스누즈 알림에도 동일 카테고리 적용)
