# 📌 현재 상태 (마지막 업데이트: 2026-04-21 13:18)

- 진행 중 Phase: 3
- 완료 이슈: #15, #17, #19, #21, #23, #25, #27, #29, #31, #33, #35, #37, #39, #41 (14개)
- 진행 중 이슈: 없음 (다음: Phase 3 #16 화자 선택 UI 모바일)
- blocked 이슈: 없음
- 루프 작업 브랜치: `develop_loop` (origin 푸시 완료)

---

## 루프 로그

## 2026-04-21 13:18 · Issue #41 · 화자 선택 UI 웹 + 라벨 편집 API
- 브랜치: `feature/issue-41-web-speaker-picker`
- PR: #42 (merged)
- 변경 파일: 6개 (신규 2 + 수정 4)
- 요약: 백엔드에 `PATCH /voice/uploads/:uploadId/speakers/:speakerId` 추가 (라벨 1~50자, 소유권+매칭 검증). 웹 `services/api.ts` 에 `uploadVoiceAudio`/`separateUpload`/`listSpeakers`/`renameSpeaker` 헬퍼 + 타입 추가 (snake ↔ camel 흡수). 신규 `SpeakerPicker` 컴포넌트 — 모달 내 업로드 → 기존 결과 재사용 or 분리 → radio 선택 + inline 라벨 편집. `VoicesPage` 헤더에 "화자 감지" 버튼 연결. 기존 `Row` 캐스트 3곳을 `unknown` 경유로 변경해 tsc strict 통과. 테스트 14건 추가 (backend 7 + web 7). 모노레포 총 325건 통과.
- 다음: #16 모바일 화자 선택 UI
- 리스크: 선택 화자의 voice_profiles 클론 전환은 후속. 모바일은 #16 담당. 오디오 세그먼트 재생 UI 미포함(InlineAudioPlayer 연결은 URL 체계 정리 후).

---

## 2026-04-21 13:05 · Issue #39 · 업로드 오디오 화자 분리 mock
- 브랜치: `feature/issue-39-voice-separate-mock`
- PR: #40 (merged)
- 변경 파일: 5개 (수정)
- 요약: 마이그레이션 #4 `voice-speakers` 테이블/인덱스 추가. `POST /voice/uploads/:uploadId/separate` — 업로드 소유권 확인 후 `MockVoiceProvider.separate` 호출, 기존 세그먼트 삭제 후 새 `화자 N` 라벨로 INSERT. `GET /voice/uploads/:uploadId/speakers` — 시작 시간 오름차순 조회. `helpers.createMockDB().reset()` 이 `calls`+`results` 양쪽 큐를 비우도록 확장(테스트 격리 픽스). `// NEEDS_VERIFICATION: real diarization` 마커로 실연동 지점 표시. vitest 9건 추가 (voice 분리 8 / 마이그레이션 1).
- 다음: #15 화자 선택 UI 웹 (분리된 세그먼트 시각화 + 라벨 편집)
- 리스크: `/voice/diarize` 기존 라우트는 여전히 ElevenLabs 호출 경로 유지(별도 팔로업). 화자 라벨은 `화자 1/2/3` 고정 — 사용자 편집은 다음 이슈에서 처리.

---

## 2026-04-21 12:48 · Issue #37 · 원본 오디오 업로드 API + VoiceStorage 추상화
- 브랜치: `feature/issue-37-voice-upload-api`
- PR: #38 (merged)
- 변경 파일: 9개 (신규 2 + 수정 7)
- 요약: `packages/voice` 에 `VoiceStorage` 인터페이스 + `InMemoryVoiceStorage` 추가 (`// TODO: real object storage integration`). 마이그레이션 #3 `voice-uploads` 테이블 추가 (object_key/mime_type/size_bytes/duration_ms/original_name + 인덱스 2종). 백엔드 `POST /voice/upload` 라우트 신규 — multipart audio + 선택 durationMs/originalName, 10 MiB 제한, `audio/*` MIME 강제. 테스트 11건 추가 (voice 패키지 4 / backend voice.upload 6 / migrations 1).
- 다음: #14 화자 분리 mock (업로드된 object_key → MockVoiceProvider.separate 연결)
- 리스크: `InMemoryVoiceStorage` 는 Workers 리퀘스트 간 공유 불가 — 실환경에서 R2/S3 어댑터 필요. 기존 `/voice/clone` 은 아직 ElevenLabs 직접 호출 상태 (팔로업).

---

## 2026-04-21 12:40 · Issue #35 · `packages/voice` 어댑터 인터페이스 + MockVoiceProvider
- 브랜치: `feature/issue-35-voice-provider-scaffold`
- PR: #36 (merged)
- 변경 파일: 8개 (신규 7 + package-lock)
- 요약: `@voice-alarm/voice` 워크스페이스 신규. `VoiceProvider` 인터페이스 (`enroll`·`synthesize`·`separate`) 와 결정론적 `MockVoiceProvider` 구현. zod 기반 입력/결과 스키마로 검증. `// TODO: real perso.ai integration` · `// TODO: real elevenlabs integration` 주석으로 실연동 지점 명시. vitest 7건 추가 (enroll 3 / synthesize 2 / separate 2). **Phase 3 진입.**
- 다음: #13 음성 업로드 API (multipart + fixture)
- 리스크: 백엔드 라우트에 아직 연결 안 됨 — 다음 이슈에서 주입. `separate` 는 해시 기반 의사-감지로 실제 화자 감지 아님(주석 표기).

---

## 2026-04-21 12:36 · Issue #33 · 모바일 로그인·가입 화면 (이메일+비밀번호)
- 브랜치: `feature/issue-33-mobile-email-login`
- PR: #34 (merged)
- 변경 파일: 5개 (신규 3, 수정 2)
- 요약: RN `EmailPasswordForm` 신규 (로그인/가입 탭, 8자 검증, 로딩 스피너). `validateEmailPasswordForm` 순수 함수로 분리 → jest 가 AsyncStorage 없이 단독 테스트. `_layout.tsx` 에 `AuthProvider` 래핑, 홈 탭 비로그인 영역에 이메일 폼 + 구분선 + 기존 `LoginButtons` 공존. `useAuth` ↔ `useAppStore.setAuth` 동기화. jest 7건 추가. **Phase 2 완료.**
- 다음: #12 `packages/voice` 어댑터 인터페이스 (Phase 3 시작)
- 리스크: `LoginButtons` (Google/Apple) 는 여전히 `useAppStore.setAuth` 직접 호출 — 향후 `useAuth.loginWithToken` 으로 통합 필요 (팔로업 이슈).

---

## 2026-04-21 12:28 · Issue #31 · 웹 로그인·가입 화면 (이메일+비밀번호)
- 브랜치: `feature/issue-31-web-email-login`
- PR: #32 (merged)
- 변경 파일: 6개 (신규 2, 수정 4)
- 요약: `EmailPasswordForm` 컴포넌트 신규 (로그인/가입 탭, 8자 검증, 에러 표시). `LoginPage` 는 `useAuth` 직접 사용 — 이메일 폼을 기본 경로로, Google 버튼은 새로 추가한 `loginWithToken(idToken)` 으로 일원화. `App.tsx` 에서 `useState(isLoggedIn)` + `localStorage` 직접 접근 제거 → `useAuth().isAuthenticated`. `main.tsx` 에서 `AuthProvider` 래핑. vitest 5건 추가.
- 다음: #11 모바일 로그인·가입 화면 (React Native 대응)
- 리스크: 없음. 루트 테스트 277건 / lint 0 errors / typecheck 전 워크스페이스 통과.

---

## 2026-04-21 12:12 · Issue #29 · 공용 useAuth 훅 + AuthProvider
- 브랜치: `feature/issue-29-useauth-hook`
- PR: #30 (merged)
- 변경 파일: 5개 (신규)
- 요약: 웹(`localStorage`)/모바일(`AsyncStorage`) 양쪽에 대응하는 `AuthProvider` + `useAuth` 훅 구현. 초기 마운트 시 저장된 토큰으로 `/auth/me` 복원, 401 자동 로그아웃, `fetchImpl`·`storage` 주입으로 테스트 용이. 모바일 쪽은 `authApi.ts` 순수 함수로 fetch 분리. vitest 7 + jest 7 추가.
- 다음: #10 웹 로그인·가입 화면 (`useAuth` 를 실제 UI 에 연결)
- 리스크: `AuthProvider` 는 아직 App.tsx / mobile _layout.tsx 에 장착되지 않음 — 다음 이슈에서 연결.

---

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
