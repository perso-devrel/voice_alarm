# 📌 현재 상태 (마지막 업데이트: 2026-04-21 12:03)

- 진행 중 Phase: 2 (인증·사용자 모델)
- 완료 이슈: #15, #17, #19, #21, #23, #25, #27 (7개)
- 진행 중 이슈: 없음 (다음: Phase 2 #9 인증 미들웨어 / 공용 `useAuth`)
- blocked 이슈: 없음
- 루프 작업 브랜치: `develop_loop` (origin 푸시 완료)

---

## 루프 로그

## 2026-04-21 12:03 · Issue #27 · 이메일+비밀번호 가입/로그인 API
- 브랜치: `feature/issue-27-email-password-auth`
- PR: #28 (merged)
- 변경 파일: 17개
- 요약: bcryptjs + 환경 페퍼로 비밀번호 해싱, Web Crypto HS256 JWT 발급/검증, `/api/auth/register|login|me` 추가, `authMiddleware` 에서 자체 JWT 수용. 마이그레이션 #2 로 users 테이블 재정비 (google_id nullable, password_hash, email UNIQUE). zod 스키마 및 vitest 25건 추가.
- 다음: #9 인증 미들웨어 통합 + 웹/앱 공용 `useAuth` 훅 설계
- 리스크: 프로덕션에 `JWT_SECRET`·`PASSWORD_PEPPER` 시크릿 등록 필요 (배포 시 `wrangler secret put`). 비밀번호 재설정 플로우는 별도 이슈.

---

## 2026-04-17 · Issue #15 · 프로젝트 진단 및 베이스라인 문서화
- 브랜치: `feature/issue-15-project-diagnosis`
- PR: #16 (merged)
- 변경 파일: 5개 (문서만)
- 요약: `TASK.md` 커밋, `docs/STRUCTURE_BASELINE.md` · `docs/ARCHITECTURE_DECISION.md` · `docs/DIAGNOSIS.md` 신규, `PROGRESS.md` 초기화.
- 다음: #17 모노레포 구조 유지 확정 + `packages/shared` 스캐폴드
- 리스크: 없음 (문서 PR)

---

## 2026-04-21 · Issue #25 · DB 선정 & 번호 기반 마이그레이션 러너 도입
- 브랜치: `feature/issue-25-db-migration-tool`
- PR: #26 (merged)
- 변경 파일: 4개
- 요약: Turso + 자체 마이그레이션 러너 결정(ADR-006). 인라인 SQL → 번호 기반 마이그레이션으로 정비. db.ts 130줄→10줄 단순화. 테스트 5건 추가.
- 다음: Phase 2 #8 User 모델 & 가입/로그인 API
- 리스크: 없음

---

## 2026-04-21 · Issue #23 · CI 워크플로우 보강
- 브랜치: `feature/issue-23-ci-workflow`
- PR: #24 (merged)
- 변경 파일: 1개
- 요약: ci.yml에 develop_loop 트리거, lint job, test job 추가. typecheck 매트릭스에 shared 추가. **Phase 1 완료.**
- 다음: Phase 2 #7 DB 선정 & 마이그레이션 도구
- 리스크: 없음

---

## 2026-04-21 · Issue #21 · 기본 테스트 러너 설정
- 브랜치: `feature/issue-21-test-runner-setup`
- PR: #22 (merged)
- 변경 파일: 6개
- 요약: `packages/web`에 vitest+jsdom, `apps/mobile`에 jest-expo 설정. 기본 테스트 각 2건 추가. 루트 `npm test`로 전체 222건 일괄 실행 가능.
- 다음: #6 CI 초안 (GitHub Actions)
- 리스크: 없음

---

## 2026-04-21 · Issue #19 · 린트·포맷·타입체크 파이프라인 통합
- 브랜치: `feature/issue-19-lint-typecheck-pipeline`
- PR: #20 (merged)
- 변경 파일: 3개
- 요약: 루트 `typecheck` 스크립트 추가, `packages/web`·`apps/mobile`에 typecheck 스크립트 추가. `lint`, `format:check`, `typecheck` 루트에서 일괄 실행 가능.
- 다음: #5 기본 테스트 러너 설정 (Vitest + Jest)
- 리스크: 기존 포맷 미적용 파일 103건, ESLint 경고 12건 (별도 이슈로 처리)

---

## 2026-04-17 · Issue #17 · 모노레포 구조 유지 + packages/shared 스캐폴드
- 브랜치: `feature/issue-17-shared-scaffold`
- PR: (작성 예정)
- 변경 파일: 8개 (신규 `packages/shared/**` + `package-lock.json` 갱신)
- 요약: `@voice-alarm/shared` 워크스페이스 추가, `UserPlan`·`UserSchema`·`VoiceProfile` zod 스키마와 vitest 6건 추가.
- 다음: 루트 통합 typecheck 스크립트 + 웹/모바일 테스트 러너 추가 이슈 생성
- 리스크: 기존 백엔드/웹/모바일은 아직 `@voice-alarm/shared` 를 import 하지 않음 — 후속 이슈에서 점진 적용.

---
