# BACKLOG

## P0 (지금 바로) - 선물하기 / 친구 / 상호 알람 (사용자 핵심 목표)

### 백엔드: Friends 시스템
- [x] DB 스키마 추가: `friendships` 테이블 (`id`, `user_a`, `user_b`, `status[pending|accepted|blocked]`, `created_at`)
- [x] `lib/db.ts`의 initDB에 friendships 테이블 생성 추가
- [x] `routes/friend.ts` 신규: POST /api/friend (이메일로 요청), GET /api/friend/list, GET /api/friend/pending, PATCH /api/friend/:id/accept, DELETE /api/friend/:id
- [x] index.ts 에 friend 라우트 등록

### 백엔드: Gift 시스템
- [x] DB 스키마 추가: `gifts` 테이블 (`id`, `sender_id`, `recipient_id`, `message_id`, `status[pending|accepted|rejected]`, `note`, `created_at`)
- [x] `routes/gift.ts` 신규: POST /api/gift (보내기), GET /api/gift/received, GET /api/gift/sent, PATCH /api/gift/:id/accept, PATCH /api/gift/:id/reject
- [x] 친구 관계가 아니면 선물 불가 (validation)

### 백엔드: 상호 알람 (Cross-User Alarm)
- [x] `alarms` 테이블에 `target_user_id` 컬럼 추가 (NULL이면 본인 알람)
- [x] POST /api/alarm 에 target_user_id 파라미터 지원
- [x] GET /api/alarm 에서 본인 알람 + 타인이 본인에게 만든 알람 둘 다 반환
- [x] 친구 관계 검증 후에만 타인 알람 생성 허용

### 모바일 앱 UI
- [x] 친구 화면 신규: app/(tabs)/friends.tsx (목록, 추가, 요청 수락)
- [x] 메시지 작성 후 "선물하기" 버튼 추가 (message/create.tsx)
- [x] 받은 선물 화면 신규: app/gift/received.tsx
- [x] 친구의 알람 설정: alarm/create.tsx 에 "누구에게?" 선택 추가
- [x] 홈 화면에 "받은 선물", "친구 관리" 바로가기 추가

### 웹 대시보드 UI
- [x] FriendsPage 신규
- [x] GiftsPage 신규 (받은/보낸)
- [x] MessagesPage 에 "선물하기" 액션 추가

## P1 (그 다음) - 테스트 / 안정화

- [ ] test/ 폴더의 음성 파일로 ElevenLabs 음성 클론 통합 테스트 작성
- [ ] test/ 폴더의 음성 파일로 ElevenLabs TTS 생성 테스트
- [ ] Perso API 실제 엔드포인트 확인 후 perso.ts URL 수정 (현재 404 이슈)
- [x] 백엔드: 모든 라우트의 입력 validation 강화 (인라인 검증)
- [x] 모바일: 빈 상태 / 에러 / 로딩 UI 일관성 점검 (ErrorView 컴포넌트 + 전 탭 적용)
- [x] 모바일 앱 ↔ 백엔드 E2E 시나리오 1개 (로그인 → 음성 등록 → 메시지 → 알람) 수동 가이드 작성

## P2 - 배포 / 운영

- [x] 웹 대시보드 Cloudflare Pages 배포 검증 (자동배포 워크플로우 동작 확인)
- [x] 백엔드 자동배포 워크플로우 동작 확인
- [x] README 갱신 (현재 배포 상태, 환경변수, 실행 방법)
- [x] CHANGELOG.md 신규
- [x] ARCHITECTURE.md 신규 (다이어그램 + 데이터 흐름)

## P3 - 품질 / 성능 / 정리

- [x] TypeScript strict 모드 위반 (any) 점검 — 백엔드 완료 (0 any), 모바일/웹은 별도
- [x] 모바일 앱 `any` 타입 제거 (apps/mobile)
- [x] 웹 대시보드 `any` 타입 제거 (packages/web)
- [x] 불필요한 의존성 점검 — web에 누락된 axios/@tanstack/react-query 추가, mobile에서 미사용 expo-image-picker/expo-sqlite 제거
- [x] 코드 중복 제거 (api.ts 모바일/웹 공통 추출 검토) — 플랫폼별 차이로 공통 추출 불필요 판정
- [x] 모바일 앱 번들 크기 줄이기 — axios 제거 (native fetch 교체), 나머지 dep은 필수
- [x] 모바일 앱 API 타입 안전성 복구 (api.ts unknown → 구체 타입, app.json 정리)
- [x] 웹 로그아웃 버그 수정 (firebase_token → auth_token 키 불일치)

## P4 - 자가 생성 항목

- [ ] i18n 인프라: 모바일 앱 다국어 기반 구축 (한국어 기본, 영어 지원) — CLAUDE.md 요구사항
- [ ] 백엔드 유닛 테스트: friend/gift/alarm 라우트 핵심 로직 테스트 (vitest)
- [ ] 웹 접근성: 키보드 네비게이션 + aria-label 보강
- [ ] 모바일 오프라인 지원 강화: 캐시된 오디오 + 알람 목록 오프라인 표시
- [ ] ESLint + Prettier 설정 통일 (모노레포 루트 + 패키지별)

## 자가 생성 가능 풀 (위 목록 고갈 시)
- 관측성 (로깅/에러 리포팅), 추가 리팩터, 성능 프로파일링
