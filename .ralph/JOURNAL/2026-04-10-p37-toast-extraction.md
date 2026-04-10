---
date: 2026-04-10
slug: p37-toast-extraction
---

# P37: 공유 Toast 컴포넌트 추출 + 에러 Alert → 토스트 변환

## 집은 BACKLOG 항목
- BACKLOG 고갈 → 새 P37 항목 자가 생성: Toast 중복 코드 추출 + 에러 Alert 토스트 변환

## 접근
- gift/received.tsx와 message/create.tsx에 동일한 toast 로직이 복붙되어 있었음
- 공유 useToast hook + Toast 컴포넌트로 추출
- 기존 2개 파일 리팩터링 + 5개 탭/화면에 toast 적용 (에러 알림만, 확인 다이얼로그는 Alert.alert 유지)

## 변경 파일
- **신규** `src/hooks/useToast.ts` — useToast hook (message, opacity, show)
- **신규** `src/components/Toast.tsx` — Toast 컴포넌트 (absolute positioned, fade animation)
- **수정** `app/gift/received.tsx` — 인라인 toast → useToast + Toast, toast styles 제거, useCallback 제거
- **수정** `app/message/create.tsx` — 인라인 toast → useToast + Toast, toast/Animated/useRef 제거
- **수정** `app/(tabs)/friends.tsx` — 친구 추가 성공/에러 Alert → toast (+ 기존 ErrorView 추가 유지)
- **수정** `app/(tabs)/alarms.tsx` — 토글/삭제 에러 Alert → toast
- **수정** `app/(tabs)/voices.tsx` — 삭제 에러 Alert → toast
- **수정** `app/(tabs)/library.tsx` — 즐겨찾기/삭제 에러 Alert → toast

## 검증 결과
- Mobile `npx tsc --noEmit` — 통과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과

## 다음 루프 주의사항
- alarm/create.tsx, alarm/edit.tsx, voice/record.tsx, voice/diarize.tsx, voice/upload.tsx에도 Alert.alert 에러 알림 남아있음 → 다음 iteration에서 변환 가능
- 확인 다이얼로그(삭제/로그아웃 등)는 Alert.alert 유지가 올바름
