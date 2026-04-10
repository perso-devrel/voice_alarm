---
date: 2026-04-10
slug: p7-api-caching
---

# P7: API 응답 캐싱 (Cache-Control 헤더)

## 집은 BACKLOG 항목
- P7: 백엔드 API 응답 캐싱 (Cache-Control 헤더 + Cloudflare KV 캐시)

## 접근

기존 상태: `cache.ts` 미들웨어가 이전 루프에서 생성되었으나 git에 커밋되지 않은 상태. `index.ts`에서 이미 import하여 사용 중이었음 (publicCache → presets, privateCache → 인증 GET, noStore → mutations).

개선 사항:
1. **`stale-while-revalidate` 추가**: public 캐시에 `s-maxage=86400, stale-while-revalidate=600` 적용. CDN이 24시간 캐시하되, 만료 후 10분간 stale 응답을 제공하면서 백그라운드 리프레시. private 캐시에도 `stale-while-revalidate=60` 추가.
2. **`Vary: Authorization` 헤더**: 인증된 엔드포인트에 Vary 헤더 추가하여 사용자별 캐시 분리 보장.
3. **cacheControl 함수 확장**: `vary` 파라미터 옵션 추가.

대안 검토:
- **Cloudflare KV 캐시**: KV namespace 생성 + wrangler.toml 바인딩 + 앱 레벨 캐시 레이어 필요. 현재 단계에서는 과도한 인프라 복잡성. Cache-Control + Cloudflare CDN 캐싱이 이미 충분.
- **Cloudflare Cache API (`caches.default`)**: 직접적인 에지 캐싱 가능하나, Cache-Control 헤더만으로 동일 효과 달성. 불필요한 코드 복잡성.

결론: Cache-Control 헤더 전략이 현재 규모에서 최적. KV는 트래픽 증가 시 재검토.

## 변경 파일
1. `packages/backend/src/middleware/cache.ts` — stale-while-revalidate 추가, Vary 헤더 지원, cacheControl 시그니처 확장

## 검증 결과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- cache.ts가 이전 루프에서 생성되었으나 git에 추가되지 않았음. 이번 루프에서 수정 완료. harness가 자동 커밋 시 untracked 파일도 포함되어야 함.
- KV 캐시는 BACKLOG "자가 생성 가능 풀"에 추가하지 않음 — 필요 시점에 재검토.
