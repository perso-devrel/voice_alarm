---
date: 2026-04-10
slug: p9-audio-level-viz
---

# P9: 녹음 실시간 오디오 레벨 시각화

## 집은 BACKLOG 항목
- P9: 모바일 음성 녹음 화면에서 실시간 오디오 레벨 시각화

## 접근

이번 iteration에서 총 4개 항목 진행:
1. **P7 파형 플레이어 강화**: PanResponder 드래그 시킹, WaveformBar 펄스 애니메이션, Animated 플레이헤드 (player.tsx)
2. **P8 백엔드 메트릭**: logger.ts에 perf 카테고리, slow 요청 console.error 승격, req/res bytes 추가
3. **P8 알람 카운트다운**: alarms.tsx 개별 알람 카드에 per-alarm 카운트다운 표시
4. **P9 녹음 레벨 시각화**: record.tsx에 실시간 오디오 레벨 바 추가

### 녹음 레벨 시각화 상세:
- `audio.ts`의 `startRecording`에 `enableMetering` 파라미터 추가 (isMeteringEnabled)
- `record.tsx`에서 녹음 중 100ms 간격으로 `getStatusAsync()` 폴링
- `status.metering` (dB, -160~0) → `dbToNormalized` (-60~0 → 0~1 정규화)
- 최근 20개 값의 히스토리를 3px 바 20개로 표시
- 바 색상: >0.7 primary, >0.3 primaryLight, else border
- 녹음 버튼과 힌트 텍스트 사이에 배치

## 변경 파일
1. `apps/mobile/src/services/audio.ts` — startRecording에 enableMetering 옵션
2. `apps/mobile/app/voice/record.tsx` — levelHistory state, metering 폴링, 레벨 바 UI
3. `apps/mobile/app/player.tsx` — PanResponder, WaveformBar, Animated 플레이헤드
4. `apps/mobile/app/(tabs)/alarms.tsx` — per-alarm 카운트다운 표시
5. `packages/backend/src/middleware/logger.ts` — perf 카테고리, slow 경고, req/res bytes

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- P9 남은 항목: 백엔드 페이지네이션, 웹 음성 테스트 재생, 모바일 스누즈 설정
- expo-av metering은 플랫폼마다 dB 범위가 다를 수 있음 (-60 클램핑이 안전)
