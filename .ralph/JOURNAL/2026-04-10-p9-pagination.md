# P9: 친구/선물 API 페이지네이션

## 선택한 항목
P9 — 백엔드: 친구/선물 API에 페이지네이션 추가 (limit/offset 파라미터)

## 접근
- 기존 코드 확인 결과, friend `/list`는 이미 페이지네이션 구현 완료
- gift `/received`, `/sent`는 이전 iteration에서 이미 페이지네이션 추가 (git diff에 unstaged로 존재)
- 유일하게 누락된 friend `/pending`에 동일 패턴으로 페이지네이션 추가

## 구현 패턴 (전 엔드포인트 통일)
- limit: 기본 20, 최소 1, 최대 100
- offset: 기본 0
- COUNT(*) 쿼리와 데이터 쿼리를 Promise.all로 병렬 실행
- 응답에 total, limit, offset 포함

## 변경 파일
- `packages/backend/src/routes/friend.ts` — `/pending` 엔드포인트에 pagination 추가

## 검증
- `npx tsc --noEmit` 통과 (에러 0)

## 참고
- gift.ts 변경은 이전 iter의 unstaged 변경이 이미 존재. 이번 iter에서 friend.ts만 수정.
