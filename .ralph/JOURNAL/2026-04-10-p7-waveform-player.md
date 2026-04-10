---
date: 2026-04-10
slug: p7-waveform-player
---

# P7: 음성 메시지 파형 시각화 플레이어

## 집은 BACKLOG 항목
- P7: 모바일 음성 메시지 파형(waveform) 시각화 플레이어

## 접근

실제 오디오 amplitude 분석은 expo-av에서 직접 지원하지 않고 별도 네이티브 모듈이 필요하므로, messageId 기반 deterministic pseudo-waveform 생성 방식 채택:

- LCG(Linear Congruential Generator)로 messageId 해시 → 48개 바 높이 생성
- sin envelope 적용으로 자연스러운 음성 파형 형태 (양끝 낮고 중간 높음)
- `onPlaybackStatusUpdate`에서 `positionMillis / durationMillis`로 실시간 progress 추적
- 재생된 바는 primary 색상, 미재생은 primaryLight로 구분
- 각 바 탭 시 해당 위치로 seek 가능
- 하단에 현재 위치 / 전체 길이 시간 표시
- 재생 완료 후 다시 재생 시 처음부터 시작

대안: `react-native-audio-waveform` 등 외부 라이브러리 — 네이티브 빌드 필요 + dev-client 재빌드 비용이 커서 기각. TTS 음성은 대부분 짧고 정형화되어 pseudo-waveform으로 충분.

## 변경 파일
1. `apps/mobile/app/player.tsx` — waveform 바 렌더링, playback progress 추적, seek, 시간 표시 추가

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- P7 전체 완료. P8 새 항목 추가함
- P8 첫 항목: 라이브러리 탭 인라인 미니 파형 플레이어 (generateWaveform 함수를 공용 유틸로 추출 고려)
