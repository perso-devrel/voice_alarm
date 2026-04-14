# P13 완료 — 프리셋 메시지 알람 생성

## 집은 항목
P13 전체 (5개 항목)

## 발견 사항
- P13의 4개 항목(라이브러리 스와이프 삭제, 알람 페이지네이션, 웹 메시지 삭제 낙관적 업데이트, 선물 수락 낙관적 업데이트)은 이전 루프에서 이미 구현 완료 상태였음
- 실제 신규 작업은 "프리셋 메시지 선택 → TTS 생성 → 알람 설정" 원클릭 플로우 1건

## 접근
- alarm/create.tsx에 접이식 "프리셋으로 빠르게 만들기" 섹션 추가
- 기존 PRESET_CATEGORIES (presets.ts)를 직접 사용 — API 호출 없이 로컬 프리셋 표시
- 음성 프로필 선택 → 카테고리 선택 → 프리셋 텍스트 선택 → generateTTS 호출 → 성공 시 자동 메시지 선택
- getPresets API import 제거 (사용하지 않으므로), PRESET_CATEGORIES import 추가

## 변경 파일
- `apps/mobile/app/alarm/create.tsx` — 프리셋 UI + TTS mutation + 상태 관리
- `apps/mobile/src/i18n/ko.json` — alarmCreate 키 6개 추가
- `apps/mobile/src/i18n/en.json` — alarmCreate 키 6개 추가
- `.ralph/BACKLOG.md` — P13 완료, P14 신규 생성
- `.ralph/STATE.md` — 갱신

## 검증
- `npx tsc --noEmit` 통과 (모바일)

## 주의사항
- getPresets API가 import되어 있었으나 사용처 없어 제거함
- readyVoices 필터는 showPreset=true일 때만 쿼리 실행 (불필요한 API 호출 방지)
