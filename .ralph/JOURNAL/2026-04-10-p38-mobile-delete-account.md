---
date: 2026-04-10
slug: p38-mobile-delete-account
---

# P38: 모바일 설정 화면 계정 삭제 기능

## 집은 BACKLOG 항목
- P38: 모바일 설정 화면에 계정 삭제 기능 추가 (웹과 동일 패턴)

## 접근
- 웹 SettingsPage의 '삭제' 입력 확인 방식을 모바일에 동일하게 적용
- 인라인 확인 다이얼로그 (입력 필드 + 확인 버튼) — Modal 대신 ScrollView 내 인라인 배치
- 삭제 성공 시 clearAuth()로 로그아웃 처리 (웹과 동일)
- 삭제 실패 시 Alert.alert 에러 표시

## 변경 파일
1. `apps/mobile/src/services/api.ts` — deleteAccount() 함수 추가 (DELETE /api/user/me)
2. `apps/mobile/src/i18n/ko.json` — 계정 삭제 관련 i18n 키 7개 추가
3. `apps/mobile/src/i18n/en.json` — 영문 번역 키 7개 추가
4. `apps/mobile/app/(tabs)/settings.tsx` — 계정 삭제 버튼 + 인라인 확인 다이얼로그 UI

## 기존 미커밋 변경 포함
- `apps/mobile/app/alarm/create.tsx` — Alert → toast 변환 (P39 항목, 이전 루프 작업분)
- `apps/mobile/app/alarm/edit.tsx` — toast import 추가 (이전 루프 작업분)

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- P38 남은 항목: 웹 에러 토스트 개선, auth 미들웨어 에러 메시지
- P39 남은 항목: voice/record, voice/upload, voice/diarize toast 변환 — BACKLOG에는 [x]로 표시되어 있으나 실제 구현 확인 필요
