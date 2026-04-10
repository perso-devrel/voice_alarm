---
date: 2026-04-10
slug: p4-i18n-phase2-subscreens
---

# P4: i18n Phase 2 — Sub-screen 8개 다국어 적용

## 집은 BACKLOG 항목
- P4: i18n Phase 2: sub-screen 8개에 t() 적용

## 접근
- Phase 1에서 번역 키(ko.json/en.json 220+ 키)가 이미 정의되어 있어 JSX만 수정
- 8개 파일 중 alarm/create.tsx와 gift/received.tsx는 이미 완전 i18n 적용 상태로 확인
- 실제 작업 대상: 6개 파일 (onboarding, message/create, voice/record, voice/upload, voice/diarize, player)

### 발견 사항
- onboarding.tsx, record.tsx: 일부 i18n이 이전 루프에서 이미 적용되어 있었음 (linter/harness에 의한 자동 적용 추정)
- message/create.tsx: t() 변수 섀도잉 버그 발견 — `onChangeText={(t) => ...}` 가 useTranslation의 t를 가림. `v`로 수정.
- diarize.tsx의 `formatDuration` 함수도 i18n화 (minSec 키 사용)

## 변경 파일
1. `apps/mobile/app/onboarding.tsx` — ONBOARDING_PAGES를 키 기반으로 변경, 버튼 텍스트 i18n
2. `apps/mobile/app/message/create.tsx` — t 변수 섀도잉 버그 수정 (t → v), 결과 카드 i18n
3. `apps/mobile/app/voice/record.tsx` — GUIDE_SENTENCES를 t() returnObjects로 교체, 전체 UI i18n
4. `apps/mobile/app/voice/upload.tsx` — useTranslation 추가, 전체 UI i18n
5. `apps/mobile/app/voice/diarize.tsx` — useTranslation 추가, 전체 UI + formatDuration i18n
6. `apps/mobile/app/player.tsx` — useTranslation 추가, 반응 버튼 i18n

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` — 통과
- 모든 sub-screen에서 하드코딩된 한국어 문자열 제거 확인 (comments 제외)

## 다음 루프
- P4 i18n Phase 2 완료 — 전체 모바일 앱 i18n 적용 완료
- BACKLOG의 다음 미완료 항목으로 이동
