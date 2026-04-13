---
date: 2026-04-10
slug: p3-web-any-removal-bugfix
---

# P3: 웹 대시보드 `any` 타입 제거 + 로그아웃 버그 수정

## 집은 BACKLOG 항목
- P3: 웹 대시보드 `any` 타입 제거 (packages/web)
- P3: 불필요한 의존성 점검
- P3: 코드 중복 제거 (api.ts 검토)

## 접근

### 웹 `any` 제거 (이전 iter에서 미커밋 상태로 완료됨)
- MessagesPage.tsx: `v: any` → `VoiceProfile`, `cat: any` → `PresetCategory`, `msg: any` → `Message`, `f: any` → `Friend`, `err: any` → `err: unknown` + `getApiErrorMessage()`
- VoicesPage.tsx: `profile: any` → `VoiceProfile`, 에러 표시에 `getApiErrorMessage()` 사용
- `types.ts` 및 `getApiErrorMessage()` 유틸은 이전 iter에서 신규 생성됨
- grep 확인: 웹 src/ 전체에서 `any` 0개

### 로그아웃 버그 수정
- SettingsPage.tsx line 99: `localStorage.removeItem('firebase_token')` → `'auth_token'`으로 수정
- 원인: api.ts 인터셉터는 `auth_token`을 사용하는데 logout은 `firebase_token`을 삭제 → 로그아웃 후에도 인증 토큰이 남아있는 버그

### 의존성 점검 결과
- 웹/백엔드: 미사용 의존성 없음
- 모바일: `expo-notifications`, `expo-sqlite`, `expo-constants` 등이 직접 import 되지 않으나, Expo 프레임워크 peer dep이거나 계획된 기능(알림, 로컬 캐시)용이므로 유지 판단

### 코드 중복 검토 (api.ts)
- 모바일/웹 api.ts는 엔드포인트 함수 시그니처가 유사하나, 플랫폼 의존성(AsyncStorage vs localStorage, env config, FormData 타입)이 근본적으로 다름
- 공유 패키지 추출은 빌드 복잡도 대비 이득이 적어 현 상태 유지 판단

## 변경 파일
1. `packages/web/src/pages/MessagesPage.tsx` — any → 구체 타입 (6곳), 에러 처리 개선
2. `packages/web/src/pages/VoicesPage.tsx` — any → VoiceProfile, 에러 처리 개선
3. `packages/web/src/pages/SettingsPage.tsx` — 로그아웃 토큰 키 버그 수정

## 검증 결과
- Web `npx tsc --noEmit` 통과
- Web `npm run build` 통과 (294.77 KB JS)
- 웹 전체 `any` 0개 확인

## 다음 루프 주의사항
- Perso API 404 이슈는 외부 문서 접근 없이 해결 불가 → blocked 유지
- P1 ElevenLabs 테스트는 API 키 필요 → 실환경에서만 가능
- 남은 P3: 번들 크기 최적화
