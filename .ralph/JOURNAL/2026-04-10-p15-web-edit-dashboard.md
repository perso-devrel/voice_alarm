# P15 완료 + P16 시작: 대시보드/Stats API

## 집은 항목
- P15: 웹 알람 편집 인라인 UI (시간/반복 수정)
- P15: 백엔드 voice 페이지네이션 (이미 완료 확인)
- P15: 웹 대시보드 홈에 요약 통계

## 접근
1. **알람 편집 UI**: 이미 `AlarmEditInline` 컴포넌트가 존재 (시간/반복/메시지 변경). 스누즈 시간(1-30분) 편집 기능 추가 + 카드에 스누즈 표시.
2. **Voice 페이지네이션**: 이미 limit/offset + total 구현 확인. 마킹만 진행.
3. **대시보드**: 새 `DashboardPage` 생성. 기존 API(getAlarms, getMessages, getVoiceProfiles, getFriendList, getReceivedGifts) 활용한 StatCard 그리드 + 활성 알람/대기 선물 배너. App.tsx에 기본 랜딩 페이지로 등록.

## 변경 파일
- `packages/web/src/pages/AlarmsPage.tsx` — snooze 편집 슬라이더 + 카드에 스누즈 표시
- `packages/web/src/pages/DashboardPage.tsx` — 신규 대시보드 페이지
- `packages/web/src/App.tsx` — dashboard 탭 추가, 기본 페이지 변경

## 검증
- tsc --noEmit: 통과 (web, backend)
- npm run build (web): 통과

## 주의사항
- P15 남은 항목: 모바일 친구 프로필 상세 화면 1개
