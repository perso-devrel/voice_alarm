---
date: 2026-04-10
slug: p4-i18n-infrastructure
---

# P4: i18n 인프라 구축 + 홈 화면/레이아웃 다국어 적용

## 집은 BACKLOG 항목
- P4: i18n 인프라 — 모바일 앱 다국어 기반 구축 (한국어 기본, 영어 지원)

## 접근
- CLAUDE.md에 "한국어 기본 UI, 영어 지원" 명시되어 있으나 i18n이 전혀 없었음
- i18next + react-i18next + expo-localization 조합 선택 (RN 생태계 표준)
- 이번 iteration에서는 인프라 + 홈 화면 + 레이아웃 screen title만 적용
- 나머지 화면은 이후 iteration에서 점진적으로 적용

## 변경 파일
1. `apps/mobile/src/i18n/index.ts` — i18n 초기화 (expo-localization 기반 언어 감지)
2. `apps/mobile/src/i18n/ko.json` — 한국어 번역 (home, greeting, screen 키)
3. `apps/mobile/src/i18n/en.json` — 영어 번역
4. `apps/mobile/package.json` — i18next, react-i18next, expo-localization 추가
5. `apps/mobile/app/_layout.tsx` — i18n import, screen title에 t() 적용
6. `apps/mobile/app/(tabs)/index.tsx` — 전체 UI 텍스트 t() 적용

## 검증 결과
- Mobile `npx tsc --noEmit` 통과
- Backend `npx tsc --noEmit` 통과
- npm install 성공 (i18next, react-i18next, expo-localization 설치)

## 다음 루프 주의사항
- 나머지 탭 화면 (alarms, voices, library, friends, settings)에 i18n 적용 필요
- 모달 화면 (alarm/create, message/create, voice/*, gift/received)도 필요
- 웹 대시보드는 별도 i18n 설정 필요 (다른 iteration)
- expo-localization v15.0.3은 Expo SDK 54와 호환 확인 필요 (typecheck 통과함)
