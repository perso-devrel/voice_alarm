# P37 완료 + P38 일부

## 집은 항목
- P37: 웹 SettingsPage 계정 삭제 확인 다이얼로그 + 모바일 홈 탭 통계 에러 처리
- P38: 백엔드 DELETE /api/user/me + 테스트

## 접근
- 웹: useState로 모달 상태 관리, "삭제" 텍스트 입력 확인 후에만 삭제 버튼 활성화 (위험 동작 보호)
- 모바일: stats useQuery에 isError/refetch 추출, statsError 시 에러 카드 + 탭하여 재시도 표시
- 백엔드: DELETE /api/user/me에서 alarms → message_library → messages → voice_profiles → friendships → gifts → users 순서로 전체 삭제
- 테스트: user.test.ts에 2개 테스트 추가 (삭제 순서 검증, 양방향 관계 삭제 검증)

## 변경 파일
- packages/web/src/pages/SettingsPage.tsx — 계정 삭제 다이얼로그 추가
- packages/web/src/services/api.ts — deleteAccount() 함수 추가
- apps/mobile/app/(tabs)/index.tsx — stats 에러 상태 UI 추가
- packages/backend/src/routes/user.ts — DELETE /me 엔드포인트 추가
- packages/backend/test/user.test.ts — 삭제 테스트 2개 추가

## 검증
- Backend: tsc --noEmit 통과, 212 tests all pass (user 10개 포함)
- Web: tsc --noEmit 통과, build 통과
- Mobile: tsc --noEmit 통과

## 다음 루프 주의
- P38 남은 항목: 모바일 설정 화면 계정 삭제, 웹 에러 토스트 개선, auth 미들웨어 에러 메시지
