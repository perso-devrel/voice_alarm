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

- [x] i18n Phase 1: 번역 파일 확장 + 탭 화면 6개 + 공용 컴포넌트 2개 i18n 적용
- [x] i18n Phase 2: sub-screen 8개에 t() 적용 (onboarding, alarm/create, message/create, gift/received, voice/record, voice/upload, voice/diarize, player) — ko.json/en.json 키 이미 정의됨
- [x] 백엔드 유닛 테스트: friend/gift/alarm 라우트 핵심 로직 테스트 (vitest)
- [x] 웹 접근성: 키보드 네비게이션 + aria-label 보강
- [x] 모바일 오프라인 지원 강화: 캐시된 오디오 + 알람 목록 오프라인 표시
- [x] ESLint + Prettier 설정 통일 (모노레포 루트 + 패키지별)

## P5 - 자가 생성 항목 (2차)

- [x] 관측성: 백엔드 구조화된 로깅 미들웨어 + 글로벌 에러 핸들러
- [x] 성능: 웹 대시보드 코드 스플리팅 (React.lazy + Suspense)
- [x] 보안: API rate limiting 미들웨어 (Cloudflare Workers 환경)
- [x] 모바일: 푸시 알림 기반 알람 트리거 (expo-notifications 통합)

## P6 - 자가 생성 항목 (3차)

- [x] 모바일: 알람 알림 탭 시 플레이어 화면으로 이동 (deep link 처리)
- [x] 백엔드: 헬스체크에 DB 연결 상태 포함
- [x] 모바일: 알람 생성/수정/삭제 시 즉시 알림 재동기화
- [x] 웹: 다크모드 지원 (prefers-color-scheme + 수동 토글)

## P7 - 자가 생성 항목 (4차)

- [x] 모바일: 알람 스누즈 동작 구현 (알림에서 스누즈 액션 → N분 후 재알림)
- [x] 백엔드: API 응답 캐싱 (Cache-Control 헤더)
- [x] 웹: 반응형 모바일 레이아웃 (사이드바 → 하단 탭바 전환)
- [x] 모바일: 음성 메시지 파형(waveform) 시각화 플레이어

## P8 - 자가 생성 항목 (5차)

- [x] 모바일: 라이브러리 탭에서 메시지 재생 시 인라인 미니 파형 플레이어
- [x] 백엔드: API 엔드포인트별 요청 시간 메트릭 로깅 (구조화 로그에 duration_ms 추가)
- [x] 웹: 메시지 목록에서 오디오 미리듣기 인라인 플레이어
- [x] 모바일: 알람 목록에서 다음 알람까지 남은 시간 카운트다운 표시

## P9 - 자가 생성 항목 (6차)

- [x] 모바일: 음성 녹음 화면에서 실시간 오디오 레벨 시각화 (마이크 입력 amplitude 표시)
- [x] 백엔드: 친구/선물 API에 페이지네이션 추가 (limit/offset 파라미터)
- [x] 웹: VoicesPage에서 음성 테스트 재생 기능 (테스트 버튼 → TTS 생성 → 즉시 재생) — 이미 구현됨
- [x] 모바일: 설정 화면에서 알람 기본 스누즈 시간 설정 (글로벌 프리퍼런스)

## P10 - 자가 생성 항목 (7차)

- [x] 백엔드: voice/:id GET/DELETE에 UUID 형식 검증 추가 (잘못된 ID → 400 응답)
- [x] 모바일: alarms/voices/library 탭에 pull-to-refresh (RefreshControl) 추가
- [x] 백엔드: library 엔드포인트에 페이지네이션 추가 (limit/offset, 친구/선물과 동일 패턴)
- [x] 모바일: 친구 화면 새로고침 중 스켈레톤/딤 로딩 UX 개선
- [x] 웹: FriendsPage에서 친구 요청 수락/거절 시 낙관적 업데이트 (optimistic update)

## P11 - 자가 생성 항목 (8차)

- [x] 웹: GiftsPage에서 수락/거절 시 낙관적 업데이트 (optimistic update)
- [x] 모바일: 선물 받은 화면(gift/received.tsx) 스켈레톤 로딩 UX 개선
- [x] 백엔드: alarm 라우트에 입력 검증 강화 (UUID 형식, time 형식, repeat_days 범위 등)
- [x] 모바일: 알람 목록에서 스와이프 삭제 제스처 지원

## P12 - 자가 생성 항목 (9차)

- [x] 모바일: 음성 목록(voices 탭)에서 스와이프 삭제 제스처 지원 (alarms와 동일 패턴)
- [x] 백엔드: friend/gift/library 라우트에 UUID 형식 검증 추가 (alarm/voice와 동일 패턴)
- [x] 웹: 알람 목록에서 삭제/토글 시 낙관적 업데이트 (optimistic update)
- [x] 모바일: 선물 받은 화면에서 수락한 메시지를 즉시 알람으로 설정하는 바로가기

## P13 - 자가 생성 항목 (10차)

- [x] 모바일: 선물 수락/거절 시 낙관적 업데이트 + 수락 Alert에 "알람 설정" 바로가기
- [x] 모바일: 메시지 라이브러리 탭에서 스와이프 삭제 제스처 지원
- [x] 백엔드: GET /api/alarm에 페이지네이션 추가 (friend/gift와 동일 패턴)
- [x] 웹: 메시지 목록에서 삭제 시 낙관적 업데이트 (optimistic update)
- [x] 모바일: 알람 생성 화면에서 프리셋 메시지 선택 지원 (빈 메시지 → 프리셋 텍스트 선택 → TTS 생성 → 알람 설정)

## P14 - 자가 생성 항목 (11차)

- [x] 모바일: 알람 생성 화면에서 메시지가 없고 프리셋 미사용 시 빈 상태 안내 개선
- [x] 웹: 음성 목록에서 삭제 시 낙관적 업데이트 (optimistic update)
- [x] 백엔드: message 라우트에 페이지네이션 추가 (alarm/friend/gift와 동일 패턴)
- [x] 모바일: 메시지 생성 후 "바로 알람 설정하기" 원클릭 플로우 (message/create → alarm/create 자동 전환)
- [x] 웹: 알람 생성 화면에서 프리셋 메시지 선택 지원 (모바일과 동일 기능)

## P15 - 자가 생성 항목 (12차)

- [x] 웹: 전체 페이지 스켈레톤 로딩 UI (AlarmsPage, VoicesPage, MessagesPage, FriendsPage, GiftsPage)
- [x] 모바일: 알람 상세 편집 화면 (시간/반복/메시지 변경)
- [x] 웹: 알람 편집 인라인 UI (시간/반복 수정)
- [x] 백엔드: voice 라우트에 페이지네이션 추가 (message/alarm과 동일 패턴)
- [x] 모바일: 친구 프로필 상세 화면 (친구의 선물/알람 현황) — 이미 구현, TS 에러 수정
- [x] 웹: 대시보드 홈에 요약 통계 (알람 수, 메시지 수, 친구 수, 음성 프로필 수, 받은 선물 수)

## P16 - 자가 생성 항목 (13차)

- [x] 모바일: 알람 목록에서 비활성 알람 시각적 구분 강화 (흐리게 + 스트라이크스루)
- [x] 웹: 대시보드에 최근 활동 타임라인 (최근 생성된 알람/메시지/선물)
- [x] 백엔드: GET /api/stats 엔드포인트 (알람/메시지/음성/친구/선물 수 한 번에 반환)
- [x] 모바일: 설정 화면에 앱 버전, 계정 정보 표시 — 이미 구현 확인 (appVersion + profile.name/email)
- [x] 웹: 설정 페이지에 프로필 정보 표시 (이름, 이메일, 플랜) — 이미 구현, 이름 표시 추가

## P17 - 자가 생성 항목 (14차)

- [x] 백엔드: GET /api/stats/activity 에 voice_profiles 활동 추가 (클론 생성/삭제 이벤트)
- [x] 웹: 대시보드 StatCard에 전주 대비 변화 표시 (↑↓ 트렌드)
- [x] 모바일: 홈탭에 대시보드 요약 카드 (stats API 활용)
- [x] 백엔드: 사용자 검색 API GET /api/user/search?q= (친구 추가 시 이메일 자동완성용)
- [x] 웹: FriendsPage 친구 추가 시 이메일 자동완성 (검색 API 연동)

## P18 - 자가 생성 항목 (15차)

- [x] 백엔드: DB 인덱스 추가 (FK 컬럼, 자주 조회되는 컬럼에 CREATE INDEX IF NOT EXISTS)
- [x] 웹: React ErrorBoundary 컴포넌트 추가 (앱 크래시 시 graceful fallback)
- [x] 웹: renderPage() default case 추가 (잘못된 페이지 상태 → 대시보드 리다이렉트)
- [x] 모바일: 홈탭 통계 카드에 전주 대비 트렌드 표시 (웹과 동일, trends API 활용)

## P19 - 빌드 복구 + IIFE 리팩터링

- [x] MessagesPage.tsx 인라인 IIFE → filteredMessages const 추출 (빌드 에러 수정)
- [x] VoicesPage.tsx 인라인 IIFE → filteredProfiles const 추출 + 검색/필터 UI 추가
- [x] AlarmsPage.tsx 인라인 IIFE → filteredAlarms const 추출 (이전 루프 미커밋분 포함)

## P20 - 자가 생성 항목 (16차)

- [x] 웹: GiftsPage에 검색 + 필터 UI 추가 (보낸/받은 필터, 상태 필터)
- [x] 웹: FriendsPage에 검색 UI 추가 (이름/이메일 검색)
- [x] 백엔드: GET /api/message에 category 필터 쿼리 파라미터 — 이미 구현 확인
- [x] 모바일: 친구 추가 시 이메일 자동완성 (검색 API 연동, 웹과 동일)

## P21 - 자가 생성 항목 (17차)

- [x] 웹: 대시보드에 퀵 액션 카드 (음성 등록, 메시지 생성, 친구 추가 바로가기)
- [x] 웹: 선물 보내기 시 친구 선택 모달 (현재 prompt → 드롭다운 모달로 개선)
- [x] 백엔드: GET /api/alarm에 is_active 필터 쿼리 파라미터 추가 — 이미 구현 확인
- [x] 모바일: 메시지 라이브러리에서 카테고리별 필터 UI 추가

## P22 - 자가 생성 항목 (18차)

- [x] 모바일: 알람/음성 탭에 검색 바 추가 (웹과 동일한 검색 기능)
- [x] 웹: 선물 보내기 시 노트(메모) 입력 필드 추가 (gift API에 note 필드 이미 지원)
- [x] 모바일: 선물 보내기 시 노트 입력 필드 추가
- [x] 백엔드: DELETE /api/message/:id 에서 연관 알람 존재 시 경고 응답 추가 (409 + force=true)

## P23 - 자가 생성 항목 (19차)

- [x] 모바일: 선물 받은 화면에서 보낸 사람의 노트 표시 — 이미 구현 확인
- [x] 웹: GiftsPage에서 보낸 선물에 노트 표시 추가 (받은 선물은 이미 표시)
- [x] 백엔드: GET /api/alarm/:id 단일 알람 조회 엔드포인트 추가 (편집 화면용)
- [x] 모바일: 음성 프로필 상세 화면 (voice/detail.tsx — 메시지/알람 목록, 통계)

## P24 - 자가 생성 항목 (20차)

- [x] 웹: 메시지 삭제 시 409 응답 처리 (연관 알람 경고 confirm dialog → force 삭제)
- [x] 웹: 음성 프로필 상세 모달 (이미 구현됨)
- [x] 모바일: 알람 편집 화면에서 GET /api/alarm/:id 활용 (이미 구현됨)
- [x] 백엔드: GET /api/voice/:id/stats 엔드포인트 (이미 구현됨)

## P25 - 자가 생성 항목 (21차)

- [x] 모바일: 메시지 라이브러리 삭제는 library 항목 삭제 (알람 무관, 409 불필요 확인)
- [x] 웹: 대시보드 최근 활동에 음성 프로필 클릭 시 상세 모달 연동
- [x] 모바일: 홈 탭 "다음 알람" 카드 탭 시 알람 편집 화면으로 이동 (없으면 생성 화면)
- [x] 백엔드: GET /api/gift/received, /sent에 q= 검색 쿼리 파라미터 추가 (이름/이메일/메시지)

## P26 - 자가 생성 항목 (22차)

- [x] 웹: 알람 목록에서 음성 프로필 이름 클릭 시 상세 모달 열기 (DashboardPage와 동일 패턴)
- [x] 모바일: 알람 편집 화면에서 반복 요일 선택 UI 개선 — 이미 구현 확인 (quickSetDays 프리셋 버튼)
- [x] 백엔드: GET /api/voice에 status 필터 쿼리 파라미터 추가 (ready/processing/failed)
- [x] 모바일: 설정 화면에서 알림 권한 상태 표시 및 설정 바로가기

## P27 - 자가 생성 항목 (23차)

- [x] 백엔드: PATCH 엔드포인트 응답 개선 — alarm/friend/gift 업데이트 시 변경된 객체 반환
- [x] 웹: MessagesPage에서 음성 프로필 이름 클릭 시 상세 모달 열기
- [x] 백엔드: GET /api/message에 voice_profile_id 필터 추가 (특정 음성의 메시지만 조회) — 이미 구현 확인
- [x] 모바일: 음성 프로필 상세에서 "이 음성으로 메시지 만들기" 바로가기 버튼
- [x] 웹: 설정 페이지에 테마 선택 (라이트/다크/시스템) 영구 저장 — 이미 구현 확인 (useDarkMode hook + localStorage)

## P28 - 자가 생성 항목 (24차)

- [x] 웹: VoiceDetailModal에 "이 음성으로 메시지 만들기" 액션 버튼 추가 (모바일과 동일 기능)
- [x] 모바일: 선물 보내기 완료 후 성공 토스트 (Alert → Animated 토스트 배너, 3초 자동 소멸)
- [x] 백엔드: GET /api/friend/list에 q= 검색 쿼리 파라미터 추가 (이름/이메일 검색)
- [x] 모바일: 홈 탭에 받은 선물 미수락 배지 표시 (pending gifts count) — 이미 구현 확인 (stats.gifts.receivedPending)

## P29 - 자가 생성 항목 (25차)

- [x] 모바일: 선물 받은 화면(gift/received) 에러 핸들러 Alert → 토스트 교체 + 거절 성공 토스트 추가
- [x] 웹: GiftsPage 선물 보내기 성공 시 토스트/배너 알림 — 이미 구현 확인 (showToast)
- [x] 백엔드: GET /api/alarm에 voice_profile_id 필터 추가 — 이미 구현 확인 (count 쿼리 JOIN 포함)
- [x] 모바일: 메시지 라이브러리에서 메시지 탭 시 상세 화면 (message/[id].tsx, _layout 등록, library 탭 연동)

## P30 - 자가 생성 항목 (26차)

- [ ] 웹: 메시지 상세 모달 (MessagesPage에서 메시지 클릭 시 텍스트 전문 + 재생 + 알람 설정)
- [ ] 모바일: 알람 목록에서 알람 탭 시 편집 화면으로 이동 (현재 스와이프만 가능)
- [ ] 백엔드: GET /api/gift/received, /sent에 페이지네이션 total 정확도 개선 (JOIN 포함 count)
- [ ] 모바일: 홈 탭 "다음 알람" 카드에 메시지 미리보기 텍스트 표시

## 자가 생성 가능 풀 (위 목록 고갈 시)
- 추가 리팩터, 성능 프로파일링, Sentry 연동
