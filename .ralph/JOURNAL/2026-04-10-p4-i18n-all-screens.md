---
date: 2026-04-10
slug: p4-i18n-all-screens
---

# P4: i18n t() 적용 — 모든 나머지 화면 완료

## 집은 BACKLOG 항목
- P4: i18n 적용 — 나머지 탭/모달 화면에 t() 적용

## 접근
- 이전 iteration에서 i18n 인프라 + ko.json/en.json 번역 키가 이미 준비됨
- 홈/레이아웃/탭 화면은 이미 적용 완료, friends.tsx는 미커밋 상태로 적용 완료
- 이번 iteration에서 나머지 7개 화면 모두 한꺼번에 적용 (기계적 작업이므로)

## 변경 파일
1. `apps/mobile/app/alarm/create.tsx` — useTranslation + 20개 하드코딩 문자열 → t() 교체
2. `apps/mobile/app/message/create.tsx` — useTranslation + 20+개 문자열 → t() 교체
3. `apps/mobile/app/gift/received.tsx` — useTranslation + 15개 문자열 → t() 교체
4. `apps/mobile/app/onboarding.tsx` — useTranslation + ONBOARDING_PAGES를 titleKey/descKey 방식으로 리팩터
5. `apps/mobile/app/voice/record.tsx` — useTranslation + GUIDE_SENTENCES를 t('voiceRecord.sentences') 배열로 교체
6. `apps/mobile/app/voice/upload.tsx` — useTranslation + 7개 문자열 → t() 교체
7. `apps/mobile/app/voice/diarize.tsx` — useTranslation + 15+개 문자열 → t() 교체
8. `apps/mobile/app/(tabs)/settings.tsx` — getPlanLabel()의 "월" 하드코딩 → t() 교체
9. `apps/mobile/src/i18n/ko.json` — settings.planFree/planPlus/planFamily 키 추가
10. `apps/mobile/src/i18n/en.json` — settings.planFree/planPlus/planFamily 키 추가 ("/mo" 사용)

## 검증 결과
- Mobile `npx tsc --noEmit` 통과
- Backend `npx tsc --noEmit` 통과
- Web `npx tsc --noEmit` 통과

## 다음 루프 주의사항
- 모바일 앱의 모든 화면에 i18n 적용 완료
- player.tsx는 이미 적용되어 있었음
- message/create.tsx의 onChangeText에서 `t` 변수명 충돌 → linter가 `v`로 자동 수정
- 웹 대시보드는 별도 i18n 설정 필요 (별도 iteration)
- PRESET_CATEGORIES (presets.ts)의 카테고리 라벨/메시지는 아직 하드코딩 — 프리셋 자체가 한국어 콘텐츠이므로 별도 검토 필요
