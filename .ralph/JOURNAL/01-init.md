# Ralph Loop 가동 — 초기화

## 컨텍스트
- 사용자가 야간 무인 모드 가동 직전에 작성한 시드 항목
- VoiceAlarm 프로젝트의 핵심 기능(선물하기/친구/상호 알람)이 미구현 상태
- 백엔드만 Cloudflare Workers에 배포된 상태, 웹/앱은 미배포

## 현재 아키텍처 핵심 파일
- 백엔드 진입점: `packages/backend/src/index.ts`
- DB 초기화: `packages/backend/src/lib/db.ts`
- 라우트: `packages/backend/src/routes/{voice,tts,alarm,user,library}.ts`
- 외부 API 클라이언트: `packages/backend/src/lib/{perso,elevenlabs}.ts`
- 인증 미들웨어: `packages/backend/src/middleware/auth.ts` (Google OAuth + Apple)
- 모바일 앱: `apps/mobile/app/(tabs)/`
- 웹 대시보드: `packages/web/src/pages/`

## 첫 번째 루프가 해야 할 일
BACKLOG P0 첫 항목부터:
1. `packages/backend/src/lib/db.ts` 의 initDB 에 `friendships` 테이블 추가
2. `packages/backend/src/types.ts` 에 Friendship 인터페이스 추가
3. typecheck 통과 확인
4. JOURNAL 갱신, STATE 갱신, BACKLOG 항목 [x] 표시

## 다음 루프가 알아야 할 주의사항
- 절대 main 브랜치 건드리지 말 것
- .env, .dev.vars, test/* 커밋 금지
- 외부 API 호출은 최소화 (테스트 시 1~2회만)
- typecheck 실패한 채로 커밋 금지
