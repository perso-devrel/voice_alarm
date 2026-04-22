# TASK.md — Voice Alarm 서비스 고도화 (Ralph Loop)

## 🎯 목표
`voice_alarm` 프로젝트를 **웹 + 모바일 앱 + 백엔드** 구조로 고도화한다.
핵심 기능: 음성 등록 → 학습된 목소리로 알람/TTS → 이용권·가족 플랜 → 가족 간 알람 공유 → 게이미피케이션.
하룻밤 Ralph 루프로 반복 구현하고, 아침에 사용자가 `develop_loop` 브랜치를 리뷰 후 `develop`에 머지한다.

---

## 📁 작업 환경
- **로컬 경로**: `C:\Users\EST-INFRA\Desktop\alarm`
- **원격 저장소**: https://github.com/perso-devrel/voice_alarm
- **베이스 브랜치**: `develop`
- **루프 작업 브랜치**: `develop_loop` (모든 PR의 머지 타겟)

### 저장소 구조 결정 (권장)
모노레포 + 워크스페이스. Phase 0에서 기존 구조를 확인하고, 비어있거나 단일 프로젝트면 아래 구조로 재편:
```
voice_alarm/
├─ apps/
│  ├─ web/          # Next.js (웹 프론트)
│  ├─ mobile/       # React Native + Expo (모바일)
│  └─ backend/      # Node.js (Express/Fastify/NestJS 중 선택)
├─ packages/
│  ├─ shared/       # 공용 타입·API 계약·validation schema(zod)
│  ├─ voice/        # 음성 처리 어댑터 (Provider 인터페이스 + mock 구현)
│  └─ ui/           # 공용 UI 컴포넌트 (선택, 웹/앱이 다르면 생략)
└─ docs/
```
기존 코드가 이미 다른 스택(Flutter 등)이면 **기존 스택 유지**하고 monorepo 재편은 Phase 1 이슈로 따로 제안만.

---

## 🚫 절대 금지 사항 (Critical Rules)

1. **`perso.ai`, `ElevenLabs` API 실호출 금지** — 크레딧 소진 방지. 음성 합성/클로닝은 전부 mock 어댑터로 대체하고, `// TODO: real voice provider integration` 주석 남긴다.
2. **외부 결제 서비스 실연동 금지** (Stripe, 토스페이먼츠, 아임포트 등). 결제는 스텁으로 처리하되 이용권 코드 발급/검증 로직은 실구현.
3. **외부 푸시 서비스 실연동 금지** (FCM/APNs 실키 발급 금지). 알림은 로컬 노티 + 로그 출력으로 대체.
4. **`develop`/`main` 브랜치에 직접 커밋·머지 금지.** 모든 변경은 이슈 브랜치 → `develop_loop` PR 머지 경로만 사용.
5. **force push 금지.**
6. **`.env`, `*.key`, `*.pem`, `google-services.json`, `GoogleService-Info.plist` 등 민감 파일 커밋 금지.** `.gitignore` 에 없으면 먼저 추가.
7. **원격 브랜치 삭제 금지.**
8. **외부 서비스 가입·결제 금지.**
9. **실제 사용자 데이터/녹음 파일 커밋 금지.** 테스트용은 `fixtures/` 안의 합성 샘플만 사용.
10. **앱스토어·구글플레이 배포 빌드 금지.** 로컬 개발 빌드까지만.

---

## 🔁 Git 워크플로우 (반드시 준수)

### 🇰🇷 언어 규칙 (필수)
**모든 이슈 제목/본문, 커밋 메시지, PR 제목/본문은 한국어로 작성한다.**
- 예외: 코드·변수명·에러 스택트레이스·라이브러리 이름·파일 경로는 원문 영어 그대로
- Conventional Commits의 `type(scope)` 프리픽스는 영어 유지 (`feat(backend):`). 콜론 뒤 subject부터 한국어.
- 기술 용어는 원문 영어 병기 권장 (예: "푸시 알림(push notification) 스케줄러")

### 최초 1회 (Phase 0)
```bash
git fetch origin
git checkout develop
git pull origin develop
git checkout -b develop_loop
git push -u origin develop_loop
```

### 각 이슈마다 반복
1. `gh issue create` — 한국어 이슈 작성 (아래 템플릿)
2. 이슈 브랜치 생성 (`develop_loop` 기반):
   ```bash
   git checkout develop_loop
   git pull origin develop_loop
   git checkout -b feature/issue-{번호}-{짧은-영문-설명}
   ```
3. 구현 + 테스트 + 한국어 커밋
4. `git push -u origin feature/issue-{번호}-{설명}`
5. `gh pr create --base develop_loop --head feature/issue-{번호}-{설명}` — 한국어 PR
6. 자체 검증 (린트/타입체크/테스트) 통과 시 머지
7. `gh pr merge --squash --delete-branch`
8. `PROGRESS.md` 업데이트

### 브랜치 네이밍 (영어 유지)
- `feature/issue-12-voice-upload-api`
- `fix/issue-18-alarm-scheduler-race`
- `chore/issue-5-monorepo-setup`
- `docs/issue-30-api-spec`

### 커밋 메시지 (Conventional Commits, subject·body 한국어)
```
<type>(<scope>): <한국어 subject>

<한국어 body>

Refs: #<issue-number>
```
- `type`: feat / fix / chore / docs / refactor / test / perf
- `scope`: web / mobile / backend / shared / voice / ui / ci / docs
- 예:
  - `feat(backend): 음성 업로드 API 엔드포인트 추가`
  - `fix(mobile): 알람 재생 시 오디오 세션 누수 수정`
  - `chore(ci): 모노레포 워크스페이스 lint 설정 통합`

### 이슈 템플릿 (한국어)
이슈 제목 예: `[Phase 2] 음성 업로드 API 기본 구현`
```markdown
## 배경
<왜 필요한지>

## 범위
- 한다: <구체적 작업>
- 안 한다: <스코프 밖>

## 완료 조건
- [ ] <체크리스트>
- [ ] <테스트 추가>

## 참고
<관련 파일/링크>
```

### PR 템플릿 (한국어)
PR 제목 예: `[#12] 음성 업로드 API 기본 구현`
```markdown
## 개요
- 이슈: #<번호>
- 요약: <한 줄>

## 변경 내용
- <주요 변경>
- <추가 변경>

## 검증
- [ ] `npm run lint` 통과
- [ ] `npm run typecheck` 통과
- [ ] `npm test` 통과
- [ ] 백엔드 통합 테스트 (해당 시)
- [ ] 수동 확인 (해당 시)

## 리스크 / 팔로업
- <리스크>
- <다음에 처리할 것>
```

---

## 📋 작업 계획 (Phase별)

> 각 Phase는 순서대로 진행. Phase 내 이슈도 번호 순. 한 iteration = 이슈 1개.

### Phase 0 — 환경 준비 (이슈 없음)
- `develop` 최신화 → `develop_loop` 생성·push
- `gh auth status` 확인, 실패 시 `PROGRESS.md`에 기록하고 Phase 0에서 DONE
- Node/npm 버전, 기존 저장소 구조, 기존 스택 확인 → `docs/STRUCTURE_BASELINE.md`
- 모노레포 재편 vs 기존 구조 유지 판단 → 결정 내용을 `docs/ARCHITECTURE_DECISION.md` 로 기록

### Phase 1 — 기존 코드 진단 & 모노레포 정비 (#1~#6)
- **#1 프로젝트 진단 리포트**: 의존성·스크립트·폴더 구조·TODO 주석 모두 수집 → `docs/DIAGNOSIS.md`
- **#2 모노레포 구조 확정**: `apps/web`, `apps/mobile`, `apps/backend`, `packages/shared` 스캐폴드. 기존 코드가 있으면 해당 앱 폴더로 이동.
- **#3 `packages/shared` 셋업**: 공용 TypeScript 설정, zod 스키마 기반 타입 export
- **#4 린트·포맷·타입체크 파이프라인 통합**: ESLint + Prettier + tsc 루트에서 일괄 실행되도록
- **#5 기본 테스트 러너 설정**: Vitest (web/backend/shared) + Jest (mobile if RN) — 기본 테스트 1개씩 통과
- **#6 CI 초안**: GitHub Actions 워크플로우 (`develop_loop` PR에서 lint/typecheck/test 실행). 시크릿 없이 가능한 범위만.

### Phase 2 — 인증·사용자 모델 (#7~#11)
- **#7 DB 선정 & 마이그레이션 도구**: SQLite(개발) + Prisma 권장. 결정 기록.
- **#8 User 모델 & 가입/로그인 API**: 이메일+비밀번호. bcrypt, JWT. 비밀번호는 env에서 salt 읽기.
- **#9 인증 미들웨어**: 백엔드 `authGuard`, 웹/앱 공용 `useAuth` 훅 (or 동등물)
- **#10 웹 로그인·가입 화면**: Next.js 기본 UI
- **#11 모바일 로그인·가입 화면**: RN 기본 UI. 백엔드 호출 공용화는 `packages/shared/api-client`.

### Phase 3 — 음성 등록 & 화자 관리 (#12~#18)
- **#12 `packages/voice` 어댑터 인터페이스**: `VoiceProvider` 인터페이스 (enroll, synthesize, separate). 기본 구현은 `MockVoiceProvider` (샘플 오디오 재생).
- **#13 음성 업로드 API**: 파일 업로드(multipart) → 원본 저장. 로컬 파일시스템 또는 `apps/backend/uploads/` (gitignore 필수).
- **#14 화자 분리 mock**: 업로드 시 "화자 감지"를 흉내 — 실제로는 파일 메타에서 임의 1~3명 생성. `NEEDS_VERIFICATION` 주석.
- **#15 화자 선택 UI (웹)**: 업로드 후 감지된 화자 리스트에서 선택·이름 부여
- **#16 화자 선택 UI (앱)**: 동일 기능 모바일 버전
- **#17 음성 라이브러리 화면 (웹/앱)**: 등록된 음성·화자 목록, 삭제, 이름 변경
- **#18 음성 업로드/재생 E2E 시나리오 테스트** (mock provider로)

### Phase 4 — 알람 기본 기능 (#19~#25)
- **#19 Alarm 모델**: 시간·반복·활성화·연결된 voice/speakerId·모드(sound-only | tts)
- **#20 알람 CRUD API**
- **#21 알람 스케줄링 (백엔드)**: 개발용 인메모리 스케줄러 (`node-cron` 등). 프로덕션 FCM 연동은 TODO.
- **#22 웹 알람 편집 화면**
- **#23 모바일 알람 편집 화면**
- **#24 알람 재생 (sound-only)**: mock voice 파일 재생
- **#25 알람 재생 (tts)**: 텍스트 입력 → mock TTS (화자별 미리 녹음된 샘플에 텍스트 오버레이 불가하므로 "모의 TTS: 샘플 재생 + 텍스트 자막 표시"로 대체)

### Phase 5 — 이용권 & 가족 플랜 (#26~#33)
- **#26 Plan·Subscription 모델**: 개인/가족, 기간, 상태. 결제는 스텁.
- **#27 스텁 결제 엔드포인트**: 결제 "완료" 더미 응답 → Subscription 생성. 실제 PG 연동은 TODO.
- **#28 이용권 코드 발급**: 결제 1건 완료 시 1회용 코드 자동 생성. 해시·길이 규칙 설계 (`VA-XXXX-XXXX-XXXX`).
- **#29 코드 등록 API**: 코드 입력 → 유효성 검증(미사용/만료 아님) → 사용 처리. 재사용 방지(상태 enum: issued/used/expired).
- **#30 코드 공유 UI**: 웹/앱에서 발급받은 코드 표시, 공유 버튼(복사/링크). 보안 상 발급자에게만 노출.
- **#31 가족 플랜 그룹 모델**: 최대 6명. 소유자 1인 + 멤버 N인.
- **#32 가족 플랜 초대**: 초대 코드 방식 (6자리 숫자, 만료 시간 있음, 일회용). "초대 코드" vs "이메일 초대" vs "링크 초대" 비교 문서 작성 후 초대 코드 + 링크 하이브리드 추천.
- **#33 가족 플랜 참여/탈퇴·소유자 권한 양도**

### Phase 6 — 가족 간 알람 기능 (#34~#39)
- **#34 가족 허용 설정**: 사용자가 "가족이 내게 알람 추가" 허용 on/off 설정. 기본 off.
- **#35 가족 알람 추가 API (text)**: 텍스트로 알람 예약 → 대상자 화자/기본 음성으로 TTS(mock). 대상자가 허용 안 했으면 403.
- **#36 가족 알람 추가 API (voice)**: 음성 파일 업로드 → 원본 그대로 재생 or 다국어 더빙 선택 (더빙은 mock). 대상자 허용 여부 체크.
- **#37 웹 가족 알람 편집 화면**
- **#38 모바일 가족 알람 편집 화면**
- **#39 가족 알람 수신 표시**: "○○이 보낸 알람" 뱃지 + 거절/수락 UX

### Phase 7 — 게이미피케이션 (#40~#45)
- **#40 Character 모델**: 레벨, 경험치, 애정도, 성장 단계. 1인 1캐릭터(or 나무).
- **#41 경험치 규칙 설계 문서**: 알람을 "끝까지 듣고 정상 종료" → +XP, "스누즈" → 소량, "강제 종료" → 없음. 하루 최대 XP 캡.
- **#42 알람 종료 시 경험치 지급 API**
- **#43 웹 캐릭터 화면**: 캐릭터 렌더링(SVG or lottie 스텁), 탭하면 정해진 대사 랜덤 출력
- **#44 모바일 캐릭터 화면**
- **#45 성장 단계 전환 애니메이션** (심플하게)

### Phase 8 — 크로스플랫폼 품질 (#46~#50)
- **#46 공용 디자인 토큰**: `packages/ui/tokens.ts` 색/타이포/spacing. 웹·앱에서 참조.
- **#47 접근성 기본 체크**: 스크린리더, 색 대비, 터치 타겟 크기 44px 이상
- **#48 에러 경계 & 전역 에러 핸들러**
- **#49 로딩·빈 상태·에러 상태 UI 일관성**
- **#50 간단한 사용자 온보딩 튜토리얼** (첫 로그인 후 3-스텝)

### Phase 9 — 문서화 & 마무리 (#51~#55)
- **#51 `apps/backend/README.md`**: 환경 변수, 로컬 실행, 마이그레이션, 시드
- **#52 `apps/web/README.md`**, **#53 `apps/mobile/README.md`**
- **#54 루트 `README.md` + 아키텍처 다이어그램 (mermaid)**
- **#55 `docs/QA_CHECKLIST.md`**: 사용자 수동 QA용 체크리스트

---

### Phase 10 — 자율 개선 모드 (Autonomous Improvement) ♾️

> Phase 9까지 모두 머지되면 자동으로 Phase 10 진입.
> Ralph가 스스로 개선 거리를 찾아서 이슈화 → 구현 → 머지 반복.

#### 10-1. 개선 이슈 생성 절차
매 iteration 시작 시:
1. **코드베이스 스캔**: 최근 머지 PR, 테스트/린트 결과, `// TODO`·`// FIXME`·`// NEEDS_VERIFICATION` 주석, `PROGRESS.md` 리스크 항목 전부 읽기
2. **개선 후보 3개 브레인스토밍** (허용 범위 안에서만)
3. 각 후보 평가: **가치(1~5) / 리스크(1~5) / 복구성(1~5)**
4. `(가치 + 복구성) − 리스크` 최고점 1개 선택 (동점이면 변경 라인 수 적은 것)
5. `[phase-10]` 프리픽스 이슈 생성 — 본문에 점수·선택 이유 명시
6. 구현 → PR → 머지 → 빌드 검증 (깨지면 즉시 revert)

#### 10-2. ✅ 허용 범위 (Allowlist)

**버그 & 안정성**: 런타임 에러 핸들링, edge case 방어, 레이스 컨디션 해결
**테스트**: 커버리지 보강, 통합 테스트 (mock 기반), 스냅샷, flaky 안정화
**DX**: 구조화 로깅, 디버그 모드, 스택트레이스 개선, hot reload 편의
**퍼포먼스**: 번들 크기, 렌더링 최적화, lazy loading, DB 쿼리 튜닝, 인덱스 추가
**UX 폴리시**: 로딩·빈 상태·에러 상태, 키보드 단축키, 토스트 일관성, 다크모드
**접근성**: aria, 키보드 네비, 색 대비, 스크린 리더
**보안 하드닝**: CSP, input sanitization, rate limiting, 의존성 취약점 patch
**문서 & 주석**: JSDoc/TSDoc, 아키텍처 결정 기록(ADR), 예제 추가
**리팩토링**: 중복 제거, 타입 좁히기(`any` 제거), 파일 분리, 네이밍 일관성
**국제화 준비**: 한국어/영어 리소스 파일, 하드코딩 문자열 추출
**오프라인 대응**: 알람 데이터 로컬 캐시, 네트워크 실패 복구

#### 10-3. ❌ 금지 범위 (Denylist) — 위반 시 즉시 revert + blocked

- perso.ai / ElevenLabs 실호출
- 외부 유료 서비스 실연동 (Stripe 실키, FCM 실키, S3 실계정 등)
- 프레임워크 교체, 주요 라이브러리 메이저 버전업
- DB 스키마 breaking change (기존 데이터 파괴 가능)
- 디자인 시스템 근본 변경
- public API breaking change (앱↔백엔드 계약 깨기)
- 라이선스·법무 영향 변경
- 새 언어/런타임 도입 (Python 등)
- 앱스토어 배포 설정 변경

> 판단 애매하면 `docs/PHASE10_PROPOSALS.md` 에 "사람 판단 필요"로 append 후 다음 후보.

#### 10-4. Phase 10 품질 바
- 모든 PR 테스트 포함 (순수 문서 제외)
- PR 변경 라인 수 200줄 이하 권장
- 한 iteration = 한 개선 (복합 금지)

---

## ✅ 완료 조건 (DONE)

> **시간/횟수 하드 리밋 없음.** 할 일 남은 한 계속 진행. 막히면 안전 종료.

다음 중 먼저 만족되면 `DONE` 출력 후 종료:

1. **Phase 10 종료 조건 충족** (정상 종료 — Phase 1~9 완료 전제)
2. **무의미한 진전**: 연속 5회 iteration 동안 머지된 PR 0건 → `⚠️ STALLED:` 기록 후 DONE
3. **이슈 단위 3회 연속 실패** → 해당 이슈 `blocked` 처리, 다음 이슈로 이동. `blocked` 누적 5개 이상이면 DONE.
4. **복구 불가 장애 3회 연속** (`git push` 인증 실패, `gh` 실패, 디스크 풀 등) → `🚨 EMERGENCY STOP:` 기록 후 DONE
5. **Phase 이탈**: 남은 이슈가 전부 `blocked` → DONE

### Phase 10 전용 종료 조건
- 개선 후보 3회 연속 허용 범위 내에서 못 떠올림
- 5회 연속 iteration PR 머지 0건
- `docs/PHASE10_PROPOSALS.md` 누적 10건 이상

### DONE 출력 직전 반드시
- [ ] 현재 브랜치 `develop_loop` 확인
- [ ] `git status` clean
- [ ] `git push origin develop_loop` 마지막 실행
- [ ] `PROGRESS.md` 최종 상태 업데이트 (정상/STALLED/EMERGENCY 명시)
- [ ] `gh pr list --base develop_loop --state open` 이 0건

---

## 📝 PROGRESS.md 포맷

매 이슈 완료 시 append:
```markdown
## 2026-04-18 01:23 · Issue #12 · 음성 업로드 API 기본 구현
- 브랜치: feature/issue-12-voice-upload-api
- PR: #42 (merged)
- 변경 파일: 8개
- 요약: multipart 업로드 엔드포인트 + fixture 기반 단위 테스트 3종 추가.
- 다음: #13 화자 분리 mock 구현
- 리스크: 없음

---
```

최상단 요약은 항상 최신 유지:
```markdown
# 📌 현재 상태 (마지막 업데이트: 2026-04-18 05:17)
- 진행 중 Phase: 4
- 완료 이슈: #1~#22 (22개)
- 진행 중 이슈: #23
- blocked 이슈: 없음
```

---

## 🧪 iteration 행동 규범

1. **한 iteration = 이슈 1개** (병렬 금지)
2. **이슈 선택 기준**: Phase 번호 낮은 것 → 의존성 적은 것 → 번호 낮은 것
3. **이슈 시작 전** `git status` clean 확인. 아니면 먼저 커밋/푸시.
4. **오류 발생 시**: 스택트레이스+원인+시도 기록 후 재시도. 3회 이상 실패 시 이슈에 `blocked` 라벨 + 한국어 코멘트로 현재까지 발견 원인·다음에 시도해볼 것 서술. 다음 이슈로 이동.
5. **모르는 외부 사실**: 추측 구현 금지. `// NEEDS_VERIFICATION` + 해당 검증 문서(`docs/...`)에 항목 추가 후 다음으로.
6. **테스트 없는 코드 머지 금지** (스캐폴드/문서 제외)
7. **PR 변경 300줄 이하 권장**. 넘으면 이슈 쪼개기.
8. **mock 어댑터 교체 지점에는 반드시 `// TODO: real {perso.ai|elevenlabs|pg|fcm} integration` 주석** — 나중에 사람이 grep으로 찾을 수 있게.

---

## 🔐 비상 종료 시나리오

다음 상황이면 즉시 `DONE` + `PROGRESS.md` 최상단에 `🚨 EMERGENCY STOP:` 기록:
- `git push` 인증 3회 연속 실패
- `origin/develop` 브랜치 소실/변경
- `.env`, `google-services.json` 등 민감 파일이 스테이징된 채 커밋 직전
- `package.json`, `.git/` 손상
- 테스트 DB가 아닌 실제 사용자 데이터가 감지되는 경우 (절대 커밋 금지)

---

## 🤝 아침에 확인할 산출물

| 파일 | 용도 |
|---|---|
| `PROGRESS.md` | 루프 전체 진행 로그 (최상단 요약) |
| `docs/DIAGNOSIS.md` | 초기 코드 진단 |
| `docs/STRUCTURE_BASELINE.md` | 작업 전 구조 스냅샷 |
| `docs/ARCHITECTURE_DECISION.md` | 모노레포/스택 결정 기록 |
| `docs/QA_CHECKLIST.md` | 수동 QA 체크리스트 |
| `docs/PHASE10_PROPOSALS.md` | Ralph가 판단 보류한 아이디어 |
| 머지된 PR 리스트 | `gh pr list --base develop_loop --state merged` |

→ 이 자료들 + 머지된 PR 훑어보고 `develop_loop` → `develop` 머지 여부 판단.

---

## ⚠️ 특히 주의할 모호 지점 (Ralph 판단 지침)

- **"초대 코드 or 좋은 방법 추론"** → Phase 5 #32에서 3가지 비교 문서 작성 후 **초대 코드 + 딥링크 하이브리드** 채택. 근거 문서에 기록.
- **"음성 등록 시 화자 분리"** → 실제 분리 알고리즘은 perso.ai 영역이므로 **화자 1~3명을 모의 감지하는 스텁** 작성. `NEEDS_VERIFICATION` 표시하여 실제 연동 지점 명확히.
- **"캐릭터가 잘 자라는 모습"** → MVP는 단계별 정적 이미지/SVG 전환으로 충분. 애니메이션은 Phase 10에서 개선 후보.
- **"가족이 보낸 알람을 다른 언어로 더빙"** → 더빙 엔진은 mock. UI와 데이터 플로우만 완결.
- **백엔드 프레임워크 선택**: Express/Fastify/NestJS 중 **Fastify + Prisma + zod** 추천(경량+타입세이프). 기존 코드가 있으면 그것 유지. 결정 근거 `docs/ARCHITECTURE_DECISION.md`.
- **모바일 스택 선택**: 기존 스택 따름. 없으면 **React Native + Expo**. Flutter가 이미 있으면 Flutter 유지(단, TS 공유 불가 → `packages/shared` 는 JSON 스키마로만).