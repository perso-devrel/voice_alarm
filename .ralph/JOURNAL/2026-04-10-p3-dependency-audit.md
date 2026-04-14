# 2026-04-10 — P3 의존성 점검 + any 타입 확인

## 집은 항목
P3: 모바일/웹 any 타입 제거 + 불필요한 의존성 점검 + 코드 중복 제거 검토

## 접근

### any 타입
- 모바일: grep 결과 0건 (이전 루프에서 이미 정리됨)
- 웹: grep 결과 0건 (이전 루프에서 이미 정리됨)
- 전 패키지 typecheck 통과 확인

### 의존성 점검
- 전 패키지의 package.json + 소스코드 import 비교 감사 실행
- **웹 (critical)**: `@tanstack/react-query`와 `axios`가 dependencies에 누락 → 추가
  - 기존에는 모노레포 hoisting으로 동작했으나, 명시적 선언 필요
- **모바일 (cleanup)**: `expo-image-picker`, `expo-sqlite` 미사용 → 제거
  - `expo-constants`, `expo-linking`, `react-dom`: expo-router peer dep → 유지
  - `expo-crypto`: expo-auth-session PKCE에 필요 → 유지
  - `expo-notifications`: 아직 미사용이나 알람 앱 핵심 기능이므로 → 유지

### 코드 중복 (api.ts)
- 모바일 vs 웹 api.ts 비교: 엔드포인트 함수는 거의 동일하나 플랫폼 레이어가 다름
  - 인증 저장: AsyncStorage vs localStorage
  - 파일 업로드: `{uri, name, type}` vs `File`
  - 환경변수: `process.env.EXPO_PUBLIC_*` vs `import.meta.env.VITE_*`
- 공통 패키지 추출은 어댑터 패턴 필요 → 과도한 추상화로 판단, 불필요

## 변경 파일
- `packages/web/package.json` — @tanstack/react-query, axios 추가
- `apps/mobile/package.json` — expo-image-picker, expo-sqlite 제거

## 검증 결과
- backend typecheck: 통과
- mobile typecheck: 통과
- web typecheck: 통과
- web build: 통과 (294.77 kB)

## 다음 루프
- P3 번들 크기 줄이기 (web 294KB gzipped 91KB — 적정 수준이나 분석 가능)
- P1 ElevenLabs 통합 테스트 (비용 주의)
- P1 Perso API 실제 엔드포인트 확인
