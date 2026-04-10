---
date: 2026-04-10
slug: p7-waveform-player
---

# P7: 음성 메시지 파형 시각화 플레이어

## 집은 BACKLOG 항목
- P7: 모바일 음성 메시지 파형(waveform) 시각화 플레이어

## 접근

### 1차 (이전 루프)
messageId 기반 deterministic pseudo-waveform: LCG + sin envelope → 48개 바. 탭 seek, progress 추적, 시간 표시.

### 2차 (이번 루프) — 인터랙션 + 애니메이션 강화
1. **PanResponder 드래그 시킹**: 파형 위를 드래그하여 연속 seek. isSeeking 플래그로 드래그 중 onPlaybackStatus 위치 업데이트 무시 → UI 떨림 방지.
2. **WaveformBar 펄스 애니메이션**: 플레이헤드 근처 ±3개 바가 scaleY 1→1.25로 펄싱 (Animated.loop, useNativeDriver).
3. **Animated 플레이헤드 인디케이터**: 2px primaryDark 세로선이 progress에 따라 translateX 이동.
4. **유틸리티 추출**: 린터가 generateWaveform/formatTime을 src/utils/waveform.ts로 자동 추출.

## 변경 파일
1. `apps/mobile/app/player.tsx` — PanResponder, Animated playhead, WaveformBar 컴포넌트 분리, playhead 스타일
2. `apps/mobile/src/utils/waveform.ts` — 린터 자동 생성 (generateWaveform, formatTime 추출)

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- P7 전체 완료. 다음은 미완료 항목 탐색 (P1 테스트 또는 자가 생성 풀).
