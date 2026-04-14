---
date: 2026-04-10
slug: mobile-type-safety
---

# 모바일 앱 타입 안전성 복구 + app.json 정리

## 집은 BACKLOG 항목
- P3: 모바일 앱 번들 크기 줄이기 → 번들 분석 결과 대부분 필수 dep (reanimated, react-native-web은 expo-router 필수)
- 발견된 긴급 이슈: 모바일 typecheck 50+ 에러로 깨져 있었음 → 먼저 복구

## 접근

### 모바일 typecheck 복구 (우선)
- 원인: `src/services/api.ts`의 모든 API 함수가 `unknown` / `unknown[]`을 반환
- 해결: 모든 API 함수에 `VoiceProfile`, `Message`, `Alarm`, `Friend`, `PendingFriendRequest`, `Gift`, `LibraryItem`, `Speaker` 타입 적용
- `generateTTS` 반환 타입을 백엔드 실제 응답(`audio_base64`, `audio_format`, `text`, `voice_profile_id`)에 맞춤
- `Speaker` 인터페이스를 `types.ts`로 이동 (linter가 자동 정리)
- `message/create.tsx` 선물하기 취소 버튼: `() => {}` → `async () => {}` (타입 불일치 수정)

### app.json 정리
- `expo-image-picker`, `expo-sqlite` 플러그인 제거 (이전 iter에서 package.json에서 제거했으나 plugins 배열에 남아있었음)
- `android.permission.RECORD_AUDIO` 중복 제거

### 번들 크기 분석 결과
- `react-native-reanimated`: expo-router/react-native-screens의 필수 peer dep → 제거 불가
- `react-native-web`: expo-router 필수 dep → 제거 불가
- `axios` → `fetch` 전환: 이미 api.ts는 fetch 사용 중, axios는 package.json에만 남아있으나 다른 곳에서 사용 여부 미확인
- 실질적 최적화 여지 제한적

## 변경 파일
1. `apps/mobile/src/services/api.ts` — 모든 API 반환 타입을 unknown → 구체 타입으로
2. `apps/mobile/src/types.ts` — Speaker 인터페이스 추가
3. `apps/mobile/app.json` — 미설치 플러그인 제거, 중복 권한 제거
4. `apps/mobile/app/message/create.tsx` — 취소 버튼 onPress 타입 수정

## 검증 결과
- Mobile `npx tsc --noEmit` 통과 (이전: 50+ 에러)
- Backend `npx tsc --noEmit` 통과
- Web `npx tsc --noEmit && npm run build` 통과 (294.77 KB)

## 다음 루프 주의사항
- 모바일 package.json에 `axios`가 남아있으나 api.ts는 fetch 사용 — 제거 가능성 확인 필요
- P3 번들 크기 항목은 실질적으로 완료 (의미있는 최적화 여지 없음)으로 마킹 가능
