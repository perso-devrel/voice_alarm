---
date: 2026-04-10
slug: p7-snooze-caching
---

# P7: 알람 스누즈 완성 + API 응답 캐싱

## 집은 BACKLOG 항목
- P7: 알람 스누즈 동작 구현
- P7: API 응답 캐싱 (Cache-Control 헤더)

## 접근

### 스누즈
이전 루프에서 이미 구현 완료 상태였으나 커밋 안 됨:
- `notifications.ts`: weekly 알림에 `categoryIdentifier` 누락 버그 수정 완료
- `_layout.tsx`: snooze action listener 이미 동작 중
- `alarm/create.tsx`: 스누즈 분 선택 UI 이미 존재
→ 코드 변경 불필요, BACKLOG 마킹만 진행

### API 캐싱
KV 바인딩 없으므로 Cache-Control 헤더 기반:
- `publicCache`: `public, max-age=3600, s-maxage=3600` — 정적 프리셋 등
- `privateCache`: `private, max-age=30` — 인증된 GET (브라우저 캐시만)
- `noStore`: `no-store` — POST/PATCH/DELETE

대안: Cloudflare Cache API (`caches.default`) — per-user 키 관리 복잡성 대비 이득이 적어 Cache-Control로 충분하다고 판단.

## 변경 파일
1. `packages/backend/src/middleware/cache.ts` — 신규: Cache-Control 미들웨어
2. `packages/backend/src/index.ts` — publicCache(프리셋), privateCache/noStore(인증 API) 적용

## 검증 결과
- Backend `npx tsc --noEmit` — 통과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- P7 마지막 항목: 음성 메시지 파형 시각화 플레이어
- KV 바인딩 추가 시 edge caching 강화 가능하나 현재는 불필요
