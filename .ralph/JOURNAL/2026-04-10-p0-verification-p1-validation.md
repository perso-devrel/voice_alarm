---
date: 2026-04-10
slug: p0-verification-p1-validation
---

# P0 전체 완료 검증 + P1 백엔드 입력 Validation 강화

## 집은 BACKLOG 항목
- P0 전체: 모바일/웹 UI 완료 상태 검증
- P1: 백엔드 모든 라우트의 입력 validation 강화

## 접근
1. P0 모바일/웹 UI가 이미 이전 루프에서 구현된 상태임을 확인
2. 3개 패키지 모두 typecheck + web build 통과 확인
3. P1 validation 강화: alarm PATCH에 time/repeat_days/snooze_minutes 검증 추가, gift POST에 note 길이 제한 추가

## 변경 파일
1. `packages/backend/src/routes/alarm.ts` — PATCH 핸들러에 time format, repeat_days 범위, snooze_minutes 범위 검증 추가
2. `packages/backend/src/routes/gift.ts` — POST에 note 200자 제한 추가

## 검증 결과
- backend: `npx tsc --noEmit` 통과
- mobile: `npx tsc --noEmit` 통과
- web: `npx tsc --noEmit` + `npm run build` 통과

## 다음 루프 주의사항
- P1 남은 항목: 빈 상태/에러/로딩 UI 일관성 점검, E2E 시나리오 가이드
- 음성 테스트(ElevenLabs/Perso)는 실제 API 키와 test/ 음성 파일 필요 — 네트워크 호출 제한에 주의
- Perso API 404 이슈는 외부 조사 필요
