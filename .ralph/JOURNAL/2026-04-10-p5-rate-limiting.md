---
date: 2026-04-10
slug: p5-rate-limiting
---

# P5: 웹 코드 스플리팅 확인 + API Rate Limiting 미들웨어

## 집은 BACKLOG 항목
- P5: 웹 대시보드 코드 스플리팅 (React.lazy + Suspense)
- P5: API rate limiting 미들웨어 (Cloudflare Workers 환경)

## 접근

### 코드 스플리팅
이전 iteration에서 이미 완료됨 확인:
- App.tsx: 6개 페이지 모두 `React.lazy()` + `<Suspense>` 적용
- 빌드 출력: 페이지별 3-6KB 청크로 분리됨
- 추가 작업 불필요, 완료로 마킹

### Rate Limiting
Cloudflare Workers는 요청 간 메모리 공유 가능 (같은 isolate 내). 인메모리 슬라이딩 윈도우 방식 채택.

#### 구현
1. `middleware/rateLimit.ts` — 60 req/min per IP, 인메모리 Map 기반
   - `cf-connecting-ip` → `x-forwarded-for` → `unknown` 순으로 IP 추출
   - 응답 헤더: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
   - 429 응답 시 `Retry-After` 헤더 포함
   - 5분 간격 expired entry cleanup (메모리 누수 방지)
2. `index.ts` — logger 다음, CORS 전에 글로벌 등록

#### 판단 기록
- 글로벌(pre-auth) 위치에 배치: auth 엔드포인트 자체에 대한 brute force 방어
- 인메모리 방식의 한계: Workers isolate 재시작 시 리셋, 분산 환경에서 isolate별 별도 카운트. 그러나 기본 보호로 충분하며, 프로덕션에서는 Cloudflare의 내장 Rate Limiting 규칙으로 보완 가능
- 인증된 사용자는 IP 기반으로 rate limit됨 (auth 전에 실행되므로 userId 미사용)

## 변경 파일
1. `packages/backend/src/middleware/rateLimit.ts` — 신규
2. `packages/backend/src/index.ts` — import + 미들웨어 등록

## 검증 결과
- Backend `npx tsc --noEmit` — 통과
- Web `npx tsc --noEmit` + `npm run build` — 통과
- Mobile `npx tsc --noEmit` — 통과

## 다음 루프 주의사항
- Workers 배포 후 실제 트래픽으로 rate limit 동작 확인 필요
- 프로덕션에서는 Cloudflare dashboard의 Rate Limiting Rules 추가 권장
- 남은 P5 항목: 모바일 푸시 알림 (expo-notifications)
