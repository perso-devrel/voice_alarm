---
date: 2026-04-10
slug: p8-mini-waveform-player
---

# P8: 라이브러리 탭 인라인 미니 파형 플레이어

## 집은 BACKLOG 항목
- P8: 모바일 라이브러리 탭에서 메시지 재생 시 인라인 미니 파형 플레이어

## 접근

player.tsx의 `generateWaveform`과 `formatTime`을 `src/utils/waveform.ts`로 추출하고, 24바 / 28px 높이의 컴팩트한 `MiniWaveformPlayer` 컴포넌트를 신규 생성.

기존 library.tsx의 ♫ 텍스트 인디케이터를 MiniWaveformPlayer로 교체. 각 리스트 아이템 안에 인라인으로 표시되며, play/pause 버튼 + 파형 progress + 시간 표시를 포함.

대안: library 전체 카드를 TouchableOpacity로 두고 탭 시 전체 플레이어로 이동 — 이미 player.tsx가 존재하지만, 인라인 미니 플레이어가 UX적으로 더 빠른 접근 제공.

## 변경 파일
1. `apps/mobile/src/utils/waveform.ts` — 신규: generateWaveform, formatTime 공용 유틸
2. `apps/mobile/src/components/MiniWaveformPlayer.tsx` — 신규: 24바 컴팩트 파형 플레이어
3. `apps/mobile/app/(tabs)/library.tsx` — ♫ 인디케이터 → MiniWaveformPlayer 교체, 불필요 import 제거
4. `apps/mobile/app/player.tsx` — generateWaveform/formatTime을 공용 유틸에서 import로 변경

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- P8 두 번째 항목: 백엔드 API 엔드포인트별 요청 시간 메트릭 로깅
