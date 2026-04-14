# P6: Deep Link + Dark Mode + Alarm Notification Resync

## BACKLOG 항목
- P6: 알람 알림 탭 시 플레이어 화면으로 이동 (deep link 처리)
- P6: 백엔드 헬스체크에 DB 연결 상태 포함 (이미 완료됨 — 확인만)
- P6: 알람 생성/수정/삭제 시 즉시 알림 재동기화
- P6: 웹 다크모드 지원 (prefers-color-scheme + 수동 토글)

## 접근 방식

### Deep Link (모바일)
- `notifications.ts`: 알림 데이터에 `text`, `voiceName`, `category` 추가 (기존 `alarmId`, `messageId`만 있었음)
- `_layout.tsx`: `addNotificationResponseListener` 등록 → 알림 탭 시 `/player` 화면으로 라우팅
- cleanup: useEffect return에서 listener 제거

### 헬스체크 DB (백엔드)
- 이미 `index.ts`의 `GET /` 핸들러에서 `SELECT 1` 실행 후 `db: 'ok' | 'error'` 반환
- 추가 작업 불필요

### 알람 알림 재동기화 (모바일)
- `alarm/create.tsx`: 알람 생성 성공 시 `getAlarms()` → `syncAlarmNotifications()` 호출
- `(tabs)/alarms.tsx`: toggle/delete 성공 시 `fetchQuery` → `syncAlarmNotifications()` 호출
- 기존에는 alarms 탭의 useEffect에서만 sync가 일어나 타이밍 갭이 있었음

### 웹 다크모드
- CSS 변수 기반 접근: `:root`와 `.dark` 셀렉터에 색상 변수 정의
- `useDarkMode` 훅: localStorage 저장 + `prefers-color-scheme` 미디어 쿼리 리스너
- 3가지 모드: system(기본값), light, dark
- `@custom-variant dark` (Tailwind v4): class 기반 dark variant 활성화
- 모든 페이지에서 hardcoded 색상 → CSS 변수로 교체
- SettingsPage에 테마 선택 UI 추가

## 변경 파일
### 모바일
- `apps/mobile/src/services/notifications.ts` — 알림 데이터 보강
- `apps/mobile/app/_layout.tsx` — deep link listener 추가
- `apps/mobile/app/alarm/create.tsx` — 생성 후 알림 재동기화
- `apps/mobile/app/(tabs)/alarms.tsx` — toggle/delete 후 알림 재동기화

### 웹
- `packages/web/src/index.css` — CSS 변수 + dark 테마 + @custom-variant
- `packages/web/src/hooks/useDarkMode.ts` — 신규 다크모드 훅
- `packages/web/src/App.tsx` — CSS 변수 적용 + darkMode prop 전달
- `packages/web/src/pages/SettingsPage.tsx` — 테마 토글 UI + CSS 변수
- `packages/web/src/pages/VoicesPage.tsx` — CSS 변수로 교체
- `packages/web/src/pages/MessagesPage.tsx` — CSS 변수로 교체
- `packages/web/src/pages/AlarmsPage.tsx` — CSS 변수로 교체
- `packages/web/src/pages/FriendsPage.tsx` — CSS 변수로 교체
- `packages/web/src/pages/GiftsPage.tsx` — CSS 변수로 교체
- `packages/web/src/components/LoginPage.tsx` — CSS 변수로 교체

## 검증
- `apps/mobile`: `npx tsc --noEmit` 통과
- `packages/backend`: `npx tsc --noEmit` 통과
- `packages/web`: `npx tsc --noEmit` 통과 + `npm run build` 성공

## 다음 루프 참고
- P6 전체 완료
- BACKLOG에 새 항목 생성 필요 (자가 생성 풀에서 선택)
