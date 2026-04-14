---
date: 2026-04-10
slug: p3-bundle-size-axios-removal
---

# P3: 모바일 번들 크기 최적화 — axios → native fetch 교체

## 집은 BACKLOG 항목
- P3: 모바일 앱 번들 크기 줄이기

## 접근

### 분석
- 모바일 의존성 전수 조사: 실제 import 여부 + 번들 영향도 확인
- react-native-reanimated: 직접 import 없으나 expo-router 필수 peer dep → 유지
- axios (~13KB gzipped): api.ts 한 곳에서만 사용 → native fetch로 교체 가능
- zustand, @tanstack/react-query: 적극 사용 중 → 유지

### 변경 사항
1. `src/services/api.ts` 전면 재작성:
   - axios 제거, native `fetch` + `AbortController` 기반 HTTP 클라이언트
   - `ApiError` 클래스 도입 (status + responseData)
   - request/get/post/patch/del 헬퍼로 구조화
   - 모든 API 함수에 명시적 반환 타입 추가 (unknown → 구체 타입)

2. `src/types.ts`:
   - `AxiosApiError` 인터페이스 삭제
   - `getApiErrorMessage()` 를 ApiError.responseData 기반으로 재작성
   - `Speaker` 인터페이스 추가 (diarize.tsx 에서 공유)

3. 6개 컴포넌트 에러 핸들러 업데이트:
   - `(err: AxiosApiError) => err.response?.data?.error` 패턴 →
   - `(err: unknown) => getApiErrorMessage(err, fallback)` 패턴
   - 대상: alarms.tsx, friends.tsx, voices.tsx, alarm/create.tsx, message/create.tsx, voice/diarize.tsx

4. `package.json`: axios 의존성 제거

## 변경 파일
1. `apps/mobile/src/services/api.ts` — 전면 재작성 (axios → fetch)
2. `apps/mobile/src/types.ts` — AxiosApiError 삭제, Speaker 추가, getApiErrorMessage 수정
3. `apps/mobile/package.json` — axios 제거
4. `apps/mobile/app/(tabs)/alarms.tsx` — 에러 핸들러 업데이트
5. `apps/mobile/app/(tabs)/friends.tsx` — 에러 핸들러 업데이트
6. `apps/mobile/app/(tabs)/voices.tsx` — 에러 핸들러 업데이트
7. `apps/mobile/app/alarm/create.tsx` — 에러 핸들러 업데이트
8. `apps/mobile/app/message/create.tsx` — 에러 핸들러 업데이트
9. `apps/mobile/app/voice/diarize.tsx` — 에러 핸들러 업데이트, Speaker를 types.ts에서 import

## 검증 결과
- Mobile `npx tsc --noEmit` 통과
- Backend `npx tsc --noEmit` 통과
- Web `npx tsc --noEmit` + `npm run build` 통과 (294.77 KB)
- axios 참조 0건 확인 (grep)

## 다음 루프 주의사항
- node_modules에서 axios 패키지를 실제로 삭제하려면 npm install 필요 (lock file 정합성)
- react-native-reanimated는 expo-router peer dep이므로 제거 불가
- P3 번들 크기 항목 완료 처리 가능
