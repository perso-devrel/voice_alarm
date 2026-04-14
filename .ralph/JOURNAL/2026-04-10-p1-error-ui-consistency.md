# 2026-04-10 — P1 모바일 에러/로딩 UI 일관성 점검 + 추가 수정

## 집은 항목
P1: 모바일 빈 상태 / 에러 / 로딩 UI 일관성 점검

## 접근
12개 화면 전수 조사 (탭 6개 + 모달 6개). 이전 루프에서 QueryStateView 공통 컴포넌트가 이미 만들어져 있었고, 홈 화면 loading indicator도 추가되어 있었음.

## 수정 내용
1. **alarms.tsx**: toggle/delete mutation에 onError + Alert.alert 추가
2. **voices.tsx**: delete mutation에 onError + Alert.alert 추가
3. **library.tsx**: Alert import 추가 + favorite mutation에 onError 추가
4. gift/received.tsx: 확인 결과 이미 에러 핸들링 존재 — 수정 불필요

## 결과
- 이전에 5개 화면에서 mutation이 silent fail 하던 것을 모두 해소
- 모든 mutation이 실패 시 사용자에게 Alert 표시
- typecheck 통과

## 변경 파일
- `apps/mobile/app/(tabs)/alarms.tsx`
- `apps/mobile/app/(tabs)/voices.tsx`
- `apps/mobile/app/(tabs)/library.tsx`

## 다음 루프
- P1 남은: E2E 가이드, 음성 테스트 (ElevenLabs API 비용 주의)
- P2 배포 운영으로 넘어가도 좋음
- Perso API 404 이슈는 [blocked] — API 문서 없이 해결 불가
