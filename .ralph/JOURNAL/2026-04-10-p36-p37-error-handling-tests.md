# P36 완료 + P37 착수 — 에러 핸들링 + 테스트 커버리지

## 집은 항목
- P36: bodyLimit 테스트 / voice name 제한 / 401 인터셉터 / 모바일 에러 화면
- P37: DashboardPage 에러 UI / CORS 테스트

## 결과

### P36 (전항목 완료)
- bodyLimit.test.ts: 이미 작성됨, 4 tests pass 확인
- voice name 50자 제한: voice.ts:103-105에 이미 구현 확인
- 웹 401 인터셉터: api.ts:20-29에 이미 구현 확인
- 모바일 friends 탭 ErrorView 누락: friends.tsx에 ErrorView + refetch 추가 (friends/pending 양쪽)

### P37 (2/4 완료)
- DashboardPage: stats/activities 쿼리에 isError 추출 + 에러 배너 UI (재시도 버튼 포함)
- cors.test.ts 신규: 6개 테스트 (허용 origin / 프로덕션 origin / 비허용 fallback / preflight methods / allowed headers / max-age)

## 변경 파일
- `apps/mobile/app/(tabs)/friends.tsx` — ErrorView import + friends/pending 에러 분기 추가
- `packages/web/src/pages/DashboardPage.tsx` — stats/activities 에러 상태 UI 추가
- `packages/backend/src/middleware/cors.test.ts` — 신규 (6 tests)

## 검증
- Backend: 210 tests all pass (204 기존 + 6 CORS 신규)
- Web: tsc --noEmit 통과, build 통과
- Mobile: tsc --noEmit 통과

## 다음 루프 주의사항
- P37 남은 항목: SettingsPage 계정 삭제 확인 다이얼로그, 모바일 홈탭 에러 처리
