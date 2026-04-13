# P31: User/Library 라우트 버그 수정 + 테스트 추가

## 선택 항목
BACKLOG 고갈 → 자가 생성: 테스트 커버리지 확대 + 버그 수정

## 접근
- 코드베이스 전체 스캔: 8개 라우트 중 3개만 테스트 보유 (alarm, friend, gift)
- 글로벌 에러 핸들러(index.ts:162)가 있어서 try-catch 누락은 실질적 문제 아님
- user.ts PATCH /plan: rowsAffected 미확인 → 존재하지 않는 사용자에 대해 성공 반환하는 버그 발견

## 변경 파일
- `packages/backend/src/routes/user.ts` — PATCH /plan에 rowsAffected 체크 추가 (0이면 404)
- `packages/backend/test/user.test.ts` — 신규: 9개 테스트 (GET /me 기존/신규 사용자, PATCH /plan 성공/실패/404, GET /search 3건)
- `packages/backend/test/library.test.ts` — 신규: 9개 테스트 (GET / 빈/페이지네이션/필터, PATCH favorite 토글/404/400, DELETE 성공/404/400)

## 검증
- `npx tsc --noEmit` ✅ 통과
- `npx vitest run test/user.test.ts test/library.test.ts` ✅ 18/18 통과
- 기존 테스트 실패 53건은 이전 iteration부터 존재하는 pre-existing 문제 (gift.test.ts 등 mock 불일치)

## 다음 루프 참고
- 아직 미테스트 라우트: tts.ts, voice.ts, stats.ts (복잡도 높음, 외부 API 호출 포함)
- 기존 테스트 실패 수정도 필요 (gift.test.ts 등 mock DB 순서 불일치)
