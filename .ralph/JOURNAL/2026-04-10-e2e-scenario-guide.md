---
date: 2026-04-10
slug: e2e-scenario-guide
---

# P1: E2E 시나리오 수동 테스트 가이드 작성

## 집은 BACKLOG 항목
- P1: 모바일 앱 ↔ 백엔드 E2E 시나리오 1개 수동 가이드 작성

## 접근
- 백엔드 전 라우트 (voice, tts, alarm, friend, gift, user, library)와 모바일 앱 화면 구조를 분석
- 4개 시나리오로 구성: 기본 흐름, 소셜 흐름, 에러 케이스, 모바일 앱 UI 체크리스트
- curl 기반 API 테스트 + 모바일 앱 수동 체크리스트 혼합

## 변경 파일
1. `docs/E2E_SCENARIO_GUIDE.md` — 신규, 4개 시나리오 + 결과 기록 양식

## 검증 결과
- Backend `npx tsc --noEmit` 통과 (문서만 추가, 코드 변경 없음)
- Web `npx tsc --noEmit` 통과
- Mobile `npx tsc --noEmit` 통과

## 설계 결정
- Postman collection 대신 curl 기반: 별도 도구 없이 누구나 실행 가능
- 두 사용자(A, B) 시나리오: 소셜 기능(친구/선물/상호알람) 검증에 필수

## 다음 루프 주의사항
- P1 남은: ElevenLabs 음성 클론/TTS 통합 테스트, Perso API 404 이슈
- 음성 테스트는 실제 API 키 + test/ 음성 파일 필요, 비용 주의
- P2 배포/운영 항목이 대기 중
