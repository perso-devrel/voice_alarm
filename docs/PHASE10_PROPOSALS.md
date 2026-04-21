# Phase 10 개선 제안 — 사람 판단 필요

Phase 10 자율 개선 중 허용/금지 범위 판단이 애매하거나, 사람의 디자인 결정이 필요한 항목.

---

## 1. family.ts 834줄 분리

**현황**: `routes/family.ts`가 834줄로 가장 큰 라우트 파일. 초대(invites), 그룹(groups), 멤버 관리, 가족 알람(text/voice) 4개 도메인이 혼재.

**제안**: `routes/family/invites.ts`, `routes/family/groups.ts`, `routes/family/alarms.ts`로 분리.

**판단 필요**: 기존 import 경로 변경 시 다른 파일 영향. 200줄 제한 넘을 수 있음.

**점수**: 가치 4 / 리스크 3 / 복구성 3 = 총 4

---

## 2. 백엔드 console.error → 구조화 로거 통일

**현황**: 7개 라우트 22곳에서 `console.error(template string)` 사용. `middleware/logger.ts`에 구조화 로거가 이미 있으나 라우트 내부에서는 미사용.

**제안**: `lib/routeLogger.ts` 에 `logRouteError(c, err)` 헬퍼를 만들어 JSON 구조화 로깅으로 교체.

**판단 필요**: 22곳 변경 → 200줄 제한 초과 가능. 단계적 적용(파일별 PR) 필요 여부.

**점수**: 가치 3 / 리스크 2 / 복구성 4 = 총 5

---

## 3. 웹/모바일 character.ts → packages/shared 추출

**현황**: `packages/web/src/lib/character.ts`와 `apps/mobile/src/lib/character.ts`가 동일 코드. 이모지·라벨·대사·pickRandomDialogue 등.

**제안**: `packages/shared/src/character.ts`로 추출.

**판단 필요**: mobile이 `packages/*` 워크스페이스 밖이라 `@voice-alarm/shared` import 불가. npm workspace 설정 변경 또는 심볼릭 링크 필요.

**점수**: 가치 3 / 리스크 2 / 복구성 4 = 총 5

---

## 4. alarm_snoozed 5 XP 남용 방지

**현황**: `docs/XP_RULES.md`에서 alarm_snoozed가 5 XP. 일일 캡(200)이 있지만 스누즈 반복으로 40회만에 캡 도달 가능.

**제안**: alarm_snoozed를 2 XP로 하향 또는 "하루 최대 스누즈 XP 3회" 별도 캡.

**판단 필요**: 게임 디자인 결정. XP 밸런스는 사용자 테스트 데이터 기반으로 조정해야.

**점수**: 가치 2 / 리스크 3 / 복구성 4 = 총 3

---

## 5. 사용자 타임존 보정

**현황**: 알람 스케줄러와 daily_xp_reset_at 이 UTC 기준. 사용자 타임존 필드 없음.

**제안**: `users.timezone` 컬럼 추가 + 클라이언트에서 Intl.DateTimeFormat().resolvedOptions().timeZone 전송.

**판단 필요**: DB 스키마 변경(breaking change 금지 범위 근접). 마이그레이션은 nullable 추가라 non-breaking이지만 기존 로직 영향 범위 넓음.

**점수**: 가치 4 / 리스크 4 / 복구성 2 = 총 2

---

## 6. Lottie/스프라이트 기반 캐릭터 애니메이션

**현황**: 성장 단계 전환이 이모지 scale+fade. MVP에서는 충분하지만 앱 정체성 부족.

**제안**: 각 스테이지별 SVG/Lottie 에셋 + 전환 애니메이션.

**판단 필요**: 디자인 에셋 필요(Ralph가 생성 불가). 에셋 파일 크기/라이선스 결정.

**점수**: 가치 5 / 리스크 3 / 복구성 3 = 총 5 (에셋 의존으로 자율 구현 불가)

---

## 7. 웹/모바일 API 클라이언트 통합

**현황**: `packages/web/src/services/api.ts`(axios 기반, 42개 함수)와 `apps/mobile/src/services/api.ts`(fetch 기반, 46개 함수)가 대부분 동일한 엔드포인트를 중복 정의.

**제안**: `packages/api-client` 워크스페이스에 HTTP 클라이언트 추상화 + 엔드포인트 정의를 통합.

**판단 필요**: HTTP 클라이언트(axios vs fetch) 통일 결정. mobile이 workspace 밖이라 import 경로 설계.

**점수**: 가치 4 / 리스크 3 / 복구성 3 = 총 4

---

## 8. 대시보드 캐릭터 요약 위젯

**현황**: 대시보드에 알람/메시지/음성/친구/선물 통계는 있지만 캐릭터 정보 없음. 캐릭터 페이지로 이동해야 레벨/XP 확인 가능.

**제안**: StatCard 형태로 캐릭터 이모지 + Lv + 스테이지 라벨 노출. `GET /api/characters/me` 호출 추가.

**판단 필요**: 대시보드 API 호출 수 증가(현재 3개 → 4개). 캐릭터가 없는 사용자(첫 방문) 처리.

**점수**: 가치 4 / 리스크 2 / 복구성 4 = 총 6

---

## 9. 하드코딩 문자열 i18n 추출

**현황**: 웹 페이지 컴포넌트에 한국어 문자열이 직접 하드코딩. 모바일은 i18next로 ko/en 분리 완료.

**제안**: 웹에도 i18next 도입 또는 단순 상수 파일 분리.

**판단 필요**: 웹은 한국어 전용? 영어 지원 범위? i18next vs 단순 상수 파일?

**점수**: 가치 4 / 리스크 3 / 복구성 3 = 총 4

---

## 10. 백엔드 응답 타입 통일 (표준 envelope)

**현황**: 라우트마다 응답 구조가 다름 — `{ alarms: [...] }`, `{ profile: {...} }`, `{ error: "..." }` 등. 표준 envelope 없음.

**제안**: `{ data: T, meta?: { page, total }, error?: string }` 통일 envelope 도입.

**판단 필요**: 기존 클라이언트(웹/모바일) 모두 수정 필요 → public API breaking change (금지 범위 근접). 점진적 마이그레이션 전략 필요.

**점수**: 가치 3 / 리스크 4 / 복구성 2 = 총 1

---

*총 10건 · 최종 업데이트: 2026-04-21*
