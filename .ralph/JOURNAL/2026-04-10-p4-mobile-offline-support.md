---
date: 2026-04-10
slug: p4-mobile-offline-support
---

# P4: 모바일 오프라인 지원 강화 — 캐시된 데이터 + 오프라인 표시

## 집은 BACKLOG 항목
- P4: 모바일 오프라인 지원 강화: 캐시된 오디오 + 알람 목록 오프라인 표시

## 접근

기존 인프라 분석:
- `offlineCache.ts` — alarms/messages 캐시 함수 이미 존재
- `useNetworkStatus` hook — NetInfo 기반 연결 상태 감지 존재
- `OfflineBanner` — 오프라인 시 경고 배너 존재
- Alarms 탭 — 이미 오프라인 캐시 통합 완료 (이전 iteration)
- Home 탭 — 이미 오프라인 캐시 통합 완료 (이전 iteration, 린터 적용)
- Library 탭 — 오프라인 지원 없음
- Audio 서비스 — `expo-file-system` 으로 오디오 파일 로컬 캐시 이미 구현

### 변경 내역

1. **`offlineCache.ts`**: `LibraryItem` 타입 임포트 + `cacheLibrary()`/`getCachedLibrary()` 함수 추가
2. **Library 탭**: 오프라인 캐시 통합
   - `useNetworkStatus` 훅으로 연결 상태 감지
   - 초기 로드 시 `getCachedLibrary()`로 캐시 데이터 불러오기
   - API 응답 성공 시 `cacheLibrary()`로 캐시 갱신 (전체 목록만, 즐겨찾기 필터 제외)
   - `displayItems = items ?? cachedItems` fallback 적용
   - 오프라인 + 캐시 데이터 시 "마지막으로 저장된 데이터" 배너 표시
   - 로딩/에러 시 캐시 데이터가 있으면 캐시 표시 (빈 화면 방지)
3. **Tab Layout**: `OfflineBanner` 를 전역으로 추가 (모든 탭 상단에 표시)

### 대안 검토
- React Query persist plugin (`@tanstack/query-persist-client`) 도입 검토 → 추가 의존성이며 현재 단순 AsyncStorage 캐시로 충분. 오버엔지니어링 판단.
- 오프라인 시 mutation 비활성화 → 현재 alarms 탭에서 toggle/delete 는 API 호출 실패 시 에러 Alert이 이미 표시됨. 충분.

## 변경 파일
1. `apps/mobile/src/services/offlineCache.ts` — LibraryItem 캐시 함수 추가
2. `apps/mobile/app/(tabs)/library.tsx` — 오프라인 캐시 fallback + 배너
3. `apps/mobile/app/(tabs)/_layout.tsx` — OfflineBanner 전역 적용

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- BACKLOG의 P4 항목 모두 완료됨
- 남은 미완료 항목: P1 ElevenLabs 통합 테스트 (blocked), Perso API URL 수정 (blocked)
- 자가 생성 풀에서 다음 항목 선택 필요
