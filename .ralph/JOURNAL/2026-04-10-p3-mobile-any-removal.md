---
date: 2026-04-10
slug: p3-mobile-any-removal
---

# P3: 모바일 앱 `any` 타입 완전 제거

## 집은 BACKLOG 항목
- P3: 모바일 앱 `any` 타입 제거 (apps/mobile)

## 접근
- `apps/mobile/src/types.ts` 신규 생성: 백엔드 `types.ts` 기반으로 모바일 전용 인터페이스 정의
  - `VoiceProfile`, `Message`, `Alarm`, `Friend`, `PendingFriendRequest`, `Gift`, `LibraryItem`, `AxiosApiError`
  - API 조인 결과 필드도 포함 (voice_name, friend_email 등)
- 약 30개 `any` 사용을 모두 구체 타입으로 교체

### 주요 변경 패턴
1. **`err: any` → `err: AxiosApiError`**: 모든 mutation onError 콜백 (10곳)
2. **`item: any` → 구체 타입**: renderItem 콜백 (alarms, library, voices)
3. **`(x as any)` → `(x as unknown as T)`**: FormData.append, expo-av status
4. **lazy-load `any` → function types**: audio.ts의 expo-file-system 함수들
5. **`catch (err: any)` → `catch (err: unknown)`**: auth.ts Apple sign-in, message/create gift

### 대안 고려
- `@types/expo-file-system` 직접 import → web 환경에서 import 불가이므로 로컬 인터페이스 정의가 적합

## 변경 파일
1. `apps/mobile/src/types.ts` — 신규 (모바일 공유 타입)
2. `apps/mobile/src/services/api.ts` — `as any` → `as unknown as Blob` (2곳)
3. `apps/mobile/src/services/audio.ts` — 6개 함수 타입 + FileInfo 인터페이스 + status cast
4. `apps/mobile/src/services/auth.ts` — `err: any` → `err: unknown` + 타입 가드
5. `apps/mobile/app/(tabs)/alarms.tsx` — Alarm, AxiosApiError 타입 적용
6. `apps/mobile/app/(tabs)/friends.tsx` — AxiosApiError 타입 적용
7. `apps/mobile/app/(tabs)/index.tsx` — Alarm 타입 적용
8. `apps/mobile/app/(tabs)/library.tsx` — LibraryItem 타입 적용
9. `apps/mobile/app/(tabs)/voices.tsx` — VoiceProfile, AxiosApiError 타입 적용
10. `apps/mobile/app/alarm/create.tsx` — Friend, Message, AxiosApiError 타입 적용
11. `apps/mobile/app/message/create.tsx` — VoiceProfile, Friend, AxiosApiError 타입 적용
12. `apps/mobile/app/voice/diarize.tsx` — AxiosApiError 타입 적용

## 검증 결과
- Mobile `npx tsc --noEmit` 통과 (any 0개)
- Backend `npx tsc --noEmit` 통과
- Web `npx tsc --noEmit` 통과

## 다음 루프 주의사항
- 웹 대시보드 (packages/web)에도 `any` 잔존 → 별도 항목으로 진행
- 모바일 types.ts는 백엔드 types.ts와 수동 동기화 필요 (향후 공유 패키지 추출 검토 가능)
