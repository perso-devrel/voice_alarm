# 📌 현재 상태 (마지막 업데이트: 2026-04-21 14:28)

- 진행 중 Phase: 5 진행 중 (#26, #27 완료, 다음 #28 이용권 코드 발급)
- 완료 이슈: #15, #17, #19, #21, #23, #25, #27, #29, #31, #33, #35, #37, #39, #41, #43, #45, #47, #49, #51, #53, #55, #57, #59, #61, #63, #65 (26개). Phase 4 완료 + Phase 5 #26, #27 완료.
- 진행 중 이슈: 없음 (다음: Phase 5 #28 이용권 코드 발급 — /billing/checkout 완료 훅에서 `VA-XXXX-XXXX-XXXX` 1회용 코드 자동 생성)
- blocked 이슈: 없음
- 루프 작업 브랜치: `develop_loop` (origin 푸시 완료)

---

## 루프 로그

## 2026-04-21 14:28 · Issue #65 · 스텁 결제 엔드포인트 (/billing/checkout, /subscription)
- 브랜치: `feature/issue-65-billing-stub`
- PR: #66 (merged)
- 변경 파일: 3개 (신규 2 + 수정 1)
- 요약: `packages/backend/src/routes/billing.ts` 신규 — `POST /checkout { plan_key }` 가 plans 테이블 조회 → 사용자 조회 → `subscriptions` 행 생성(status=`active`, expires_at=now+period_days) → `users.plan` 동기화(personal→`plus`, family→`family`). free 플랜/없는/비활성 plan_key/없는 사용자 모두 적절한 에러 응답. `GET /subscription` 가 활성 구독 + plans JOIN 으로 반환(없으면 `{subscription:null,plan:null}`). 실 PG(TossPayments/Iamport) 미연동 — `// TODO: integrate real PG` 주석, 결제수단 받지 않고 항상 성공 가정. `index.ts` 에 `/billing` 라우팅(api 하위, 인증 미들웨어 적용). vitest `billing.test.ts` 11건 (checkout 8 + subscription 3), 백엔드 302→313 / 25 파일 그린, tsc 에러 없음.
- 다음: Phase 5 #28 이용권 코드 발급 — checkout 완료 훅에서 `VA-XXXX-XXXX-XXXX` 포맷 1회용 코드 자동 발급, plans 테이블과 별도로 `voucher_codes` 테이블 추가(hash + status issued/used/expired).
- 리스크: 실 PG 연동 이전이라 checkout idempotency/재시도/환불 로직 없음. 기존 활성 구독이 있는 상태에서 재결제 시 중복 row 생성됨 — 후속 이슈에서 단일화 필요. plan_group_id 는 #31 가족 플랜 이전까지 nullable 유지.

---

## 2026-04-21 14:23 · Issue #63 · Plan·Subscription 모델 및 기본 플랜 3종 시드 (Phase 5 진입)
- 브랜치: `feature/issue-63-plan-subscription-model`
- PR: #64 (merged)
- 변경 파일: 2개 (수정)
- 요약: 마이그레이션 #6 추가 — `plans(id, key UNIQUE, name, plan_type free|personal|family, period_days, max_members, price_krw, is_active)` 와 `subscriptions(id, user_id, plan_id, plan_group_id nullable, status active|expired|cancelled, starts_at, expires_at)` 테이블 및 인덱스 4종(idx_plans_key, idx_subscriptions_user/status/expires). 기본 플랜 3종 `INSERT OR IGNORE` 시드 — `free`(무기한/1인/0원), `plus_personal`(30일/1인/4900원), `family`(30일/6인/9900원). `users.plan` 컬럼은 백워드 호환 위해 유지(활성 subscription 과 동기화 로직은 #27 결제 스텁에서 구현). `plan_group_id` 는 #31 가족 플랜 그룹 연결 이전까지 nullable. vitest 2건 추가 (테이블/인덱스/CHECK/시드 검증) → migrations 11건 / 전체 300→302건 그린, tsc 에러 없음.
- 다음: Phase 5 #27 스텁 결제 엔드포인트 — 실 PG 미연동, `POST /billing/checkout/{plan_key}` 가 더미 "완료" 응답을 반환하며 subscription row 생성 + users.plan 동기화.
- 리스크: 기존 사용자의 `users.plan` 값이 free 로 남아 있어도 활성 subscription 이 없는 한 일관성 문제는 없음. 결제 연동 이후 주기적 expiry 스윕 필요.

---

## 2026-04-21 14:17 · Issue #61 · 알람 미리듣기 액션 라우터 + 🔈 버튼 (Phase 4 종료)
- 브랜치: `feature/issue-61-mobile-tts-preview-action`
- PR: #62 (merged)
- 변경 파일: 3개 (수정)
- 요약: `alarmPlayback.ts` 에 `buildAlarmPreviewAction(plan)` 순수 함수 추가 — #59 의 PlaybackPlan 을 `navigate(/player)` / `preview-audio(uri,caption)` / `toast(message)` 액션으로 디스패치. tts 는 기존 player 화면으로 라우팅되어 자막(text) 이 자동 오버레이되고, sound-only / fallback 은 caption 을 자막으로 사용해 바로 재생. `(tabs)/alarms.tsx` 알람 카드에 🔈 미리듣기 버튼 추가 — `stopPropagation` 으로 편집 이동 차단, messages/voices 쿼리 연결해 resolver 에 전달, 실패 시 mock 파일 번들 안내 토스트. jest 6건 (buildAlarmPreviewAction 4 + 엔드투엔드 2), 모바일 61→67 / 전체 420→426. **Phase 4 종료** — TASK.md #19~#25 (Alarm 모델 확장 + CRUD 정규화 + 스케줄러 + 웹/모바일 편집 UI + sound-only/tts 재생) 7개 이슈 전부 달성.
- 다음: Phase 5 #26 Plan·Subscription 모델 — 개인/가족 플랜 스키마, 기간/상태, 결제 스텁 엔드포인트 설계
- 리스크: mock URI 실체 번들 후속. 노티피케이션 발화 시 자동 재생(백그라운드 오디오 세션) 은 별도 이슈. speaker 별 세그먼트 오버레이는 Phase 6 이후.

---

## 2026-04-21 14:12 · Issue #59 · 알람 재생 resolver (sound-only mock) + 모드 뱃지
- 브랜치: `feature/issue-59-mobile-alarm-playback-resolver`
- PR: #60 (merged)
- 변경 파일: 3개 (신규 2 + 수정 1)
- 요약: `apps/mobile/src/lib/alarmPlayback.ts` 신규 — 순수 함수 `resolveAlarmPlayback(alarm, messages, voices)` 가 `mode` / `voice_profile` / 메시지 매칭 여부에 따라 `tts` / `sound-only` / `fallback` / `error` 계획을 반환. sound-only 는 voice_profile 미지정·미매칭·`processing|failed` 모두 `MOCK_DEFAULT_ALARM_URI` fallback 하고, 정상 경로에서만 `MOCK_VOICE_SAMPLE_URI` 반환. 실 교체 지점에 `// TODO: real perso.ai voice sample URL` 주석. `getAlarmModeBadge` 헬퍼로 `(tabs)/alarms.tsx` 알람 카드에 🔊 원본 / 🗣️ TTS 뱃지 표시. jest 11건 (resolveAlarmPlayback 8 + getAlarmModeBadge 3), 모바일 50→61 / 전체 409→420.
- 다음: Phase 4 #25 알람 재생 (tts) — 샘플 + 자막 오버레이 방식의 mock TTS 재생 경로. 이어서 알람 시각 도달 시 자동 재생 파이프라인(노티피케이션 → 포그라운드 player 라우팅).
- 리스크: `asset:///audio/mock-*.mp3` 는 계약 URI 만 정의 — 실제 번들 파일은 후속 이슈. Player 화면은 여전히 TTS 로컬 캐시 기반이라 sound-only 경로 실재생은 #25 에서 연결.

---

## 2026-04-21 14:06 · Issue #57 · 모바일 알람 편집 화면 mode 토글 및 voice_profile 연결
- 브랜치: `feature/issue-57-mobile-alarm-mode-ui`
- PR: #58 (merged)
- 변경 파일: 8개 (신규 2 + 수정 6)
- 요약: `apps/mobile/src/lib/alarmForm.ts` 신규 — 웹(#55)과 동일 계약의 `validateAlarmForm`/`buildCreatePayload`/`parseRepeatDays` 순수 헬퍼. `Alarm` 타입에 `mode / voice_profile_id / speaker_id` 추가, `repeat_days: number[] | string` 으로 호환 확장. `createAlarm`/`updateAlarm` 서비스 옵션 확장. `app/alarm/create.tsx`, `app/alarm/edit.tsx` 에 🗣 TTS / 🔊 원본 radio 토글과 음성 프로필 picker 추가 — sound-only 시 음성 프로필 미지정이면 제출 버튼 disabled + 안내. 기존 3곳의 `JSON.parse(alarm.repeat_days||'[]')` (`edit.tsx`, `(tabs)/alarms.tsx`, `services/notifications.ts`) 을 `parseRepeatDays` 로 안전 치환 — 백엔드 #20 정규화 이후 배열 응답과 과거 문자열 응답 양쪽 대응. jest 17건 추가 (buildCreatePayload 5 / validateAlarmForm 6 / parseRepeatDays 6), 모바일 33→50 / 전체 359→409.
- 다음: Phase 4 #24 알람 재생 (sound-only) — 선택된 voice_profile 의 mock 음성 파일을 알람 시각에 재생하는 로컬 파이프라인. 이어서 #25 tts 재생(샘플 + 자막 오버레이).
- 리스크: speaker picker 는 이번에도 연결 안 함(voice_profile 만). `repeat_days` 타입이 `number[] | string` 인 채 남아 있어 런타임 분기 필요 — Phase 10에서 타입 좁히기 후보.

---

## 2026-04-21 13:54 · Issue #55 · 웹 알람 편집 화면 mode 토글 및 voice_profile 연결
- 브랜치: `feature/issue-55-web-alarm-mode-ui`
- PR: #56 (merged)
- 변경 파일: 5개 (신규 2 + 수정 3)
- 요약: `packages/web/src/lib/alarmForm.ts` 신규 — `validateAlarmForm`/`buildCreatePayload` 순수 함수, sound-only 는 `voice_profile_id` 요구. `types.ts::Alarm` 에 mode/voice_profile_id/speaker_id 추가 및 repeat_days `number[] | string` 호환. `services/api.ts::createAlarm` 타입 확장. `AlarmsPage` 알람 카드에 모드 뱃지(🔊 원본 / 🗣️ TTS) + 생성/편집 폼에 재생 모드 라디오 그룹 추가 — sound-only 는 음성 프로필 필수로 버튼 disabled + 안내 문구. `formatRepeat`/편집 초기화의 `JSON.parse` 를 배열/문자열 양쪽 호환으로 교체. vitest 10건 추가. 모노레포 web 26→36 / 전체 349→359.
- 다음: Phase 4 #23 모바일 알람 편집 화면 (동일 UX 의 RN 버전)
- 리스크: speaker_id 선택 UI 는 후속 (speakerPicker 와 알람 폼 통합 미정). 기존 응답 호환을 위해 `repeat_days` 가 number[] | string 로 남아 있음 — 백엔드 구 엔드포인트 제거 후 단일화 가능.

---

## 2026-04-21 13:47 · Issue #53 · 알람 스케줄러 + Cloudflare Cron Trigger 스텁
- 브랜치: `feature/issue-53-alarm-scheduler`
- PR: #54 (merged)
- 변경 파일: 5개 (신규 2 + 수정 3)
- 요약: `src/lib/scheduler.ts` 신규 — `shouldAlarmFire`/`selectFiringAlarms`/`formatHHmm` 순수 함수. HH:mm + repeat_days(빈 배열=매일) + is_active 체크로 발화 대상 판정. `src/index.ts` 에 `scheduled(event, env)` export 추가 — Cloudflare Workers Cron Trigger 진입점, 활성 알람 조회→`selectFiringAlarms`→`console.warn` 로 `firing_ids` 로깅. 실 푸시는 `// TODO: FCM delivery`. `routes/alarm.ts` 에 `GET /alarm/tick` 디버그 엔드포인트 추가 — 인증된 유저의 활성 알람을 현재 UTC 시각 기준으로 드라이런. vitest 11건 추가 (scheduler 9 + tick 2). 모노레포 backend 289→300 / 전체 338→349.
- 다음: Phase 4 #22 웹 알람 편집 화면 — mode / voice_profile_id / speaker_id 를 웹 UI 에 노출 (또는 #23 모바일 알람 편집)
- 리스크: `wrangler.toml` Cron Trigger 실등록 + 실제 FCM 발송은 별도 이슈. 스케줄러는 UTC 기준 — 타임존 처리는 클라이언트가 HH:mm 저장 시 로컬 환산한다고 가정. 사용자 타임존 필드 도입은 후속.

---

## 2026-04-21 13:42 · Issue #51 · 알람 CRUD 응답 정규화 — repeat_days/is_active/mode 일관화
- 브랜치: `feature/issue-51-alarm-response-normalize`
- PR: #52 (merged)
- 변경 파일: 2개 (수정)
- 요약: `routes/alarm.ts` 에 `normalizeAlarmRow` 헬퍼 도입 — repeat_days JSON→배열(잘못된 JSON 은 빈 배열 fallback), is_active→boolean, mode null→`tts` 기본, voice_profile_id/speaker_id `undefined`→`null`. GET list/single/PATCH 반환 전부 동일 헬퍼 통과. POST 응답도 voice_profile_id/speaker_id 를 null 로 명시적 노출(body 스프레드 의존 제거). vitest 6건 추가 (목록 정규화, sound-only 노출, 잘못된 JSON fallback, 단일 정규화 + 404, POST null 명시). 모노레포 backend 283→289 / 전체 332→338.
- 다음: Phase 4 #21 알람 스케줄링 (인메모리 `setInterval` 기반 개발용 스케줄러 + Cloudflare Workers Cron Trigger TODO 주석) 또는 #22 웹 알람 편집 화면(새 mode/voice_profile 필드 UI 노출)
- 리스크: 정규화는 응답만 바꾸므로 기존 DB 레코드 호환. 기존 웹/모바일 클라이언트가 `repeat_days` 를 문자열로 파싱하던 코드가 있으면 중복 JSON.parse 발생할 수 있어 UI 이슈에서 정리 필요(후속 이슈에서 처리).

---

## 2026-04-21 13:38 · Issue #49 · Alarm 모델 확장 — mode/voice_profile_id/speaker_id (Phase 4 진입)
- 브랜치: `feature/issue-49-alarm-model-mode`
- PR: #50 (merged)
- 변경 파일: 4개 (수정)
- 요약: 마이그레이션 #5 `alarm-mode-voice-speaker` — `alarms` 에 `mode TEXT NOT NULL DEFAULT 'tts' CHECK(mode IN ('sound-only','tts'))`, `voice_profile_id TEXT`, `speaker_id TEXT` 컬럼 + 인덱스 2종 추가 (ALTER TABLE ADD COLUMN 방식). `routes/alarm.ts` POST/PATCH 모두에 mode 허용값 검증 + UUID 형식 검증 + INSERT/UPDATE/SELECT SQL 확장. 기본 mode = `tts`. vitest 7건 추가 (alarm 6 + migrations 1). 모노레포 backend 276→283 / 전체 358→332(다른 워크스페이스 변화 없음, 총합 체크로 backend 283 + shared 12 + voice 11 + web 26 = 332).
- 다음: Phase 4 후속 — 알람 트리거 실행 경로(워커/크론) 및 모드별 재생 경로(TTS 합성 vs sound-only 원본 재생) 연결
- 리스크: 컬럼 추가만 했을 뿐 실제 재생·트리거 경로는 아직 미연결 — 후속 이슈에서 구현. 기존 알람 레코드는 mode 기본값 `tts` 로 채워짐(스키마 NOT NULL DEFAULT).

---

## 2026-04-21 13:29 · Issue #47 · 음성 업로드/화자 편집 E2E 테스트 (Phase 3 종료)
- 브랜치: `feature/issue-47-voice-e2e-test`
- PR: #48 (merged)
- 변경 파일: 2개 (신규 1 + 수정 1)
- 요약: `packages/backend/test/voice.e2e.test.ts` 신규 — 업로드 → mock 분리 → 라벨 변경 → 목록 조회 체인을 실제 라우트 로직으로 관통하는 E2E 5건 (정상 1 / 다른 사용자 분리 403 / 미존재 목록 404 / 다른 사용자 PATCH 403 / speaker 미매칭 PATCH 404). `helpers.createMockDB().clearResults()` 추가 — 분리 단계 INSERT 미소비분이 다음 SELECT 를 삼키지 않도록 분리, `calls` 이력은 보존. 모노레포 backend 271→276 / 전체 353→358. **Phase 3 완료** (Phase 3 범위: 음성 어댑터 + 업로드 + 화자 분리 + 선택 UI 웹/앱 + 음성 라이브러리 이름 변경 + E2E).
- 다음: Phase 4 #19 Alarm 모델 — 현재 스키마 감사 후 음성 모드(sound-only/tts)·화자 연결·모드별 필드 보강 점검
- 리스크: E2E 는 여전히 DB mock 위에서 동작 — 실 libsql 통합/실오디오 E2E 는 별도 CI 단계(Phase 8+)에서. `/voice/diarize` 는 그대로 ElevenLabs 경로 유지.

---

## 2026-04-21 13:23 · Issue #45 · 음성 프로필 이름 변경
- 브랜치: `feature/issue-45-voice-profile-rename`
- PR: #46 (merged)
- 변경 파일: 10개 (신규 4 + 수정 6)
- 요약: 백엔드 `PATCH /voice/:id` 신규 — UUID 검증 + JSON body 파싱 + trim 후 1~50자 검증 + 소유권 확인 + `updated_at = datetime('now')` 갱신. 웹 `services/api.ts::updateVoiceProfile` + `VoicesPage` 카드에 "이름 변경" 버튼(window.prompt) + `src/lib/voiceName.ts` 순수 함수. 모바일 `services/api.ts::updateVoiceProfile` + `app/voice/[id].tsx` 인라인 `TextInput` 편집 UI(iOS/Android 공통) + `src/lib/voiceName.ts` 순수 함수. 테스트 16건 추가 (backend 6 + web 5 + mobile 5). 모노레포 백엔드 271건 / 전체 353건 통과.
- 다음: #18 음성 업로드·재생 E2E (또는 업로드 라이브러리 리스트 화면 — 업로드/화자 섹션은 별도 이슈로 분리된 상태)
- 리스크: `VoicesPage` 이름 변경은 `window.prompt` 로 단순화 — 완전한 모달 UI 는 추후 개선. 모바일 이름 편집은 `_layout.tsx` 헤더 제목과 동기화되지 않을 수 있음(쿼리 invalidate 로 리스트는 최신).

---

## 2026-04-21 13:28 · Issue #43 · 화자 선택 UI 모바일
- 브랜치: `feature/issue-43-mobile-speaker-picker`
- PR: #44 (merged)
- 변경 파일: 5개 (신규 3 + 수정 2)
- 요약: 모바일 `services/api.ts` 에 `uploadVoiceAudio`/`separateUpload`/`listSpeakers`/`renameSpeaker` 헬퍼 추가 (snake ↔ camel normalize). `src/lib/speakerPickerState.ts` 순수 reducer 분리 — idle/uploading/separating/ready/error 전이 + SELECT/EDIT_* 액션 + `sanitizeLabel`. `app/voice/picker.tsx` 신규 화면 — `useReducer` + `expo-document-picker` 기반 파일 선택 → 업로드 → 기존 결과 재사용 or 분리 → radio 선택 + inline 라벨 편집. `(tabs)/voices.tsx` 헤더에 "화자 감지 (mock)" 카드 링크 추가. jest 12건 추가 (reducer 8 + sanitizeLabel 4). 모노레포 총 337건 통과.
- 다음: #17 음성 라이브러리 화면 — 등록된 음성·화자 목록·삭제·이름 변경 (웹/앱)
- 리스크: 선택 화자 → `voice_profiles` 클론 전환은 후속. 기존 `diarize.tsx` ElevenLabs 경로는 그대로.

---

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
