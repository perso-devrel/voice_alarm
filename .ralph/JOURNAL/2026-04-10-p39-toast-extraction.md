---
date: 2026-04-10
slug: p39-toast-extraction
---

# P39: 공유 Toast 추출 + 전체 에러 Alert → 토스트 변환

## 집은 BACKLOG 항목
- BACKLOG 고갈 → P39 자가 생성: Toast 중복 제거 + 모바일 전체 에러 UX 통일

## 접근
- gift/received.tsx + message/create.tsx에 완전 동일한 toast 로직 복붙 → 공유 hook/컴포넌트 추출
- 에러/검증 Alert.alert → toast 변환 (비파괴적, 네이티브 팝업 대신 인앱 배너)
- 성공 후 화면 전환이 있는 Alert.alert(onPress: router.back)은 유지 (toast는 전환 시 소멸)
- 확인 다이얼로그(삭제/로그아웃)도 Alert.alert 유지 (사용자 의사결정 필요)

## 변경 파일 (10개)
- **신규** `src/hooks/useToast.ts` — useToast(duration?) hook
- **신규** `src/components/Toast.tsx` — Toast 컴포넌트 (absolute, fade animation)
- **리팩터** `app/gift/received.tsx` — 인라인 toast 제거, useToast 사용
- **리팩터** `app/message/create.tsx` — 인라인 toast 제거, unused useRef/Animated 제거
- **변환** `app/(tabs)/friends.tsx` — 친구 추가 성공/에러 + ErrorView 추가
- **변환** `app/(tabs)/alarms.tsx` — 토글/삭제 에러
- **변환** `app/(tabs)/voices.tsx` — 삭제 에러
- **변환** `app/(tabs)/library.tsx` — 즐겨찾기/삭제 에러
- **변환** `app/alarm/create.tsx` — TTS/생성/검증 에러
- **변환** `app/alarm/edit.tsx` — 편집/검증 에러
- **변환** `app/voice/record.tsx` — 녹음/클론/검증 에러
- **변환** `app/voice/upload.tsx` — 업로드/검증 에러
- **변환** `app/voice/diarize.tsx` — 분석/클론/검증 에러

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- P38에 미완료 항목 3개 남아있음 (모바일 계정 삭제, 웹 에러 토스트, auth 에러 메시지)
- 남은 Alert.alert은 모두 확인 다이얼로그 또는 성공+네비게이션 → 변환 불필요
