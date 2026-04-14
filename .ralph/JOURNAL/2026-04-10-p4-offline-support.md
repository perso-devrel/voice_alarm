---
date: 2026-04-10
slug: p4-offline-support
---

# P4: 모바일 오프라인 지원 강화

## 집은 BACKLOG 항목
- P4: 모바일 오프라인 지원 강화: 캐시된 오디오 + 알람 목록 오프라인 표시

## 접근
기존 상태: 오디오 파일만 expo-file-system으로 로컬 캐싱. 알람/메시지 데이터는 서버에서만 가져옴. 네트워크 감지 없음.

### 구현 내역
1. **@react-native-community/netinfo 설치** — 네트워크 상태 감지
2. **useNetworkStatus 훅** (`src/hooks/useNetworkStatus.ts`) — NetInfo 이벤트 구독, 연결 상태 boolean 반환
3. **offlineCache 서비스** (`src/services/offlineCache.ts`) — AsyncStorage에 알람/메시지 JSON 캐싱/조회
4. **OfflineBanner 컴포넌트** (`src/components/OfflineBanner.tsx`) — 오프라인 시 상단 경고 배너 표시
5. **_layout.tsx** — OfflineBanner를 Stack 위에 배치 (전역 표시)
6. **alarms.tsx** — 온라인 시 서버 데이터 캐싱, 오프라인 시 캐시 데이터 표시 + "마지막으로 저장된 데이터" 배너
7. **index.tsx (홈)** — 동일하게 알람/메시지 캐싱 + 오프라인 시 캐시 데이터로 렌더링
8. **i18n** — ko.json/en.json에 `offline.banner`, `offline.cachedData` 키 추가

### 판단 기록
- 오프라인 시 mutation(토글/삭제)은 비활성화하지 않음 — 실패 시 기존 에러 핸들링이 적절히 처리. 오프라인 큐잉은 복잡도 대비 효과가 낮아 이번 스코프에서 제외.
- React Query의 `enabled: isConnected`로 오프라인 시 불필요한 fetch 방지.
- 캐시된 데이터가 있으면 로딩/에러 상태 대신 캐시 표시 (UX 우선).

## 변경 파일
1. `apps/mobile/package.json` — @react-native-community/netinfo 추가
2. `apps/mobile/src/hooks/useNetworkStatus.ts` — 신규
3. `apps/mobile/src/services/offlineCache.ts` — 신규
4. `apps/mobile/src/components/OfflineBanner.tsx` — 신규
5. `apps/mobile/app/_layout.tsx` — OfflineBanner 임포트 및 렌더
6. `apps/mobile/app/(tabs)/alarms.tsx` — 오프라인 캐시 로직 + cachedBanner 스타일
7. `apps/mobile/app/(tabs)/index.tsx` — 오프라인 캐시 로직
8. `apps/mobile/src/i18n/ko.json` — offline 키 추가
9. `apps/mobile/src/i18n/en.json` — offline 키 추가

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- 오프라인 큐잉(mutation offline queue)은 미구현 — 필요 시 별도 항목으로 추가
- 다른 탭(library, friends, gifts)에도 동일 패턴 적용 가능하나, 알람이 가장 중요하므로 우선 적용
- P4 오프라인 지원 항목 완료 처리 가능
