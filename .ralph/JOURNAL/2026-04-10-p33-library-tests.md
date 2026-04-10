---
date: 2026-04-10
slug: p33-library-tests
---

# P33 완료: library.test.ts 추가 테스트

## 집은 BACKLOG 항목
- P33: 백엔드 library.test.ts 추가 테스트 (src/routes/ 쪽 신규)

## 접근
- library.ts 라우트 3개 엔드포인트 (GET /, PATCH /:id/favorite, DELETE /:id) 대상
- 기존 test-helper의 createMockDB/createTestApp 패턴 활용
- 필터링 (favorite, voice:, date:), 페이지네이션, 즐겨찾기 토글, 삭제 등 전체 커버

## 변경 파일
- `src/routes/library.test.ts` (신규) — 14개 테스트
  - GET /library: 7개 (기본 목록, 빈 목록, limit/offset, max clamp, favorite 필터, voice 필터, date 필터)
  - PATCH /library/:id/favorite: 4개 (잘못된 UUID, 404, 0→1 토글, 1→0 토글)
  - DELETE /library/:id: 3개 (잘못된 UUID, 404, 성공)

## 검증 결과
- `npx vitest run` — 181 tests all pass (14 new + 167 existing)
- `npx tsc --noEmit` — 통과

## 다음 루프
- P33 완전 완료. BACKLOG에서 새 항목 생성 필요.
