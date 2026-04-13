# Architecture

## System Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Mobile App │     │     Web     │     │  External APIs   │
│  (Expo RN)  │     │ (React+Vite)│     │                  │
└──────┬──────┘     └──────┬──────┘     │  - Perso.ai      │
       │                   │            │  - ElevenLabs    │
       │   HTTPS + Bearer  │            │  - Google OAuth  │
       └─────────┬─────────┘            └────────┬─────────┘
                 │                               │
         ┌───────▼───────┐                       │
         │   Cloudflare  │◄──────────────────────┘
         │   Workers     │   Server-side calls
         │   (Hono)      │   (API keys never exposed)
         └───────┬───────┘
                 │
         ┌───────▼───────┐
         │   Turso DB    │
         │   (SQLite)    │
         └───────────────┘
```

## Directory Structure

```
apps/mobile/                    React Native (Expo) 앱
├── app/
│   ├── (auth)/                 로그인/회원가입
│   ├── (tabs)/                 메인 탭 네비게이션
│   │   ├── index.tsx           홈 대시보드
│   │   ├── alarms.tsx          알람 목록
│   │   ├── voices.tsx          음성 프로필 관리
│   │   ├── library.tsx         메시지 라이브러리
│   │   ├── friends.tsx         친구 관리
│   │   └── settings.tsx        설정
│   ├── alarm/create.tsx        알람 생성
│   ├── message/create.tsx      메시지 생성 + 선물
│   ├── voice/{record,upload,diarize}.tsx
│   ├── gift/received.tsx       받은 선물
│   └── onboarding.tsx          온보딩
├── components/                 공유 컴포넌트 (QueryStateView 등)
└── services/                   API 클라이언트

packages/backend/               Cloudflare Workers API
├── src/
│   ├── index.ts                Hono 앱 진입점
│   ├── routes/                 API 라우트 핸들러
│   │   ├── alarm.ts            알람 CRUD
│   │   ├── voice.ts            음성 프로필 + 클론
│   │   ├── tts.ts              TTS 생성 + 프리셋
│   │   ├── user.ts             사용자 프로필
│   │   ├── library.ts          메시지 라이브러리
│   │   ├── friend.ts           친구 시스템
│   │   └── gift.ts             선물 시스템
│   ├── lib/
│   │   ├── db.ts               Turso 클라이언트 + 스키마
│   │   ├── perso.ts            Perso.ai 클라이언트
│   │   └── elevenlabs.ts       ElevenLabs 클라이언트
│   ├── middleware/auth.ts      JWT 인증 (Google + Apple)
│   └── types.ts                공유 타입 정의
└── wrangler.toml               Workers 설정

packages/web/                   React 웹 대시보드
├── src/
│   ├── pages/                  페이지 컴포넌트
│   │   ├── AlarmsPage.tsx
│   │   ├── VoicesPage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── FriendsPage.tsx
│   │   ├── GiftsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── components/             공유 UI 컴포넌트
│   └── services/               API 클라이언트
└── vite.config.ts
```

## Database Schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │     │voice_profiles│     │   messages    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │◄────│ user_id (FK) │  ┌──│ id (PK)      │
│ google_id    │     │ name         │  │  │ user_id (FK) │
│ email        │     │ perso_voice_id│  │  │ voice_profile│
│ name         │     │ elevenlabs_id│  │  │ text         │
│ plan         │     │ status       │  │  │ audio_url    │
│ daily_tts_*  │     └──────────────┘  │  │ category     │
└──────┬───────┘                       │  └──────────────┘
       │                               │         │
       │     ┌──────────────┐          │  ┌──────▼───────┐
       │     │   alarms     │          │  │message_library│
       │     ├──────────────┤          │  ├──────────────┤
       ├────►│ user_id (FK) │          │  │ user_id (FK) │
       │     │ target_user  │          │  │ message_id   │
       │     │ message_id ──┼──────────┘  │ is_favorite  │
       │     │ time         │             └──────────────┘
       │     │ repeat_days  │
       │     │ snooze_min   │
       │     └──────────────┘
       │
       │     ┌──────────────┐     ┌──────────────┐
       │     │ friendships  │     │    gifts      │
       │     ├──────────────┤     ├──────────────┤
       ├────►│ user_a (FK)  │     │ sender_id    │
       └────►│ user_b (FK)  │     │ recipient_id │
             │ status       │     │ message_id   │
             └──────────────┘     │ status       │
                                  │ note         │
                                  └──────────────┘
```

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | 사용자 프로필 + 플랜 | google_id, email, plan (free/plus/family), daily_tts_count |
| `voice_profiles` | AI 음성 클론 프로필 | perso_voice_id, elevenlabs_voice_id, status (processing/ready/failed) |
| `messages` | TTS 생성 메시지 | text, audio_url, category |
| `alarms` | 알람 설정 | time (HH:mm), repeat_days (JSON), target_user_id (상호 알람) |
| `message_library` | 사용자 메시지 보관함 | is_favorite |
| `friendships` | 친구 관계 | user_a→user_b, status (pending/accepted/blocked) |
| `gifts` | 메시지 선물 | sender→recipient, status (pending/accepted/rejected) |

## Data Flow

### Voice Clone → TTS → Alarm

```
1. 사용자가 음성 녹음/업로드
   POST /api/voice/clone (multipart audio)
        │
        ▼
2. 백엔드가 외부 AI API 호출
   Perso.ai createVoiceClone() 또는
   ElevenLabs createInstantClone()
        │
        ▼
3. voice_profiles 테이블에 저장 (status: ready)
        │
        ▼
4. 사용자가 텍스트 입력 + 음성 선택
   POST /api/tts/generate
        │
        ▼
5. 백엔드가 TTS API 호출 → audio_base64 반환
   messages + message_library 테이블에 저장
        │
        ▼
6. 사용자가 알람 설정
   POST /api/alarm { message_id, time, repeat_days }
```

### Gift Flow

```
User A                          User B
  │                               │
  ├─ POST /api/gift ─────────────►│
  │  { recipient_email,           │
  │    message_id, note }         │
  │                               │
  │               GET /api/gift/received
  │                               │
  │          PATCH /api/gift/:id/accept
  │               │               │
  │               ▼               │
  │         message_library에     │
  │         메시지 자동 추가       │
  │                               │
  │                    POST /api/alarm
  │                    (선물 메시지로 알람 설정)
```

## Authentication

```
Client                    Backend                   Google/Apple
  │                         │                          │
  │  ID Token (JWT)         │                          │
  ├────────────────────────►│                          │
  │  Authorization: Bearer  │  tokeninfo API call      │
  │                         ├─────────────────────────►│
  │                         │  { sub, email, name }    │
  │                         │◄─────────────────────────┤
  │                         │                          │
  │                         │  users 테이블 조회/생성
  │                         │  (google_id = sub)
  │  200 OK                 │
  │◄────────────────────────┤
```

- Google: `oauth2.googleapis.com/tokeninfo` 호출로 검증
- Apple: JWT 페이로드 디코딩 + 만료 확인 (프로덕션은 JWKS 서명 검증 필요)

## Plan Limits

| 리소스 | Free | Plus | Family |
|--------|------|------|--------|
| 음성 프로필 | 1개 | 3개 | 10개 |
| 일일 TTS 생성 | 3회 | 무제한 | 무제한 |
| 알람 | 2개 | 무제한 | 무제한 |

## External Services

| Service | Purpose | Client Location |
|---------|---------|----------------|
| Perso.ai | 음성 클론 + TTS (1차) | `lib/perso.ts` |
| ElevenLabs | 음성 클론 + TTS + 화자분리 (보조) | `lib/elevenlabs.ts` |
| Turso | SQLite DB (Edge) | `lib/db.ts` |
| Google OAuth | 사용자 인증 | `middleware/auth.ts` |
| Apple Sign-In | iOS 사용자 인증 | `middleware/auth.ts` |

## Deployment

```
develop branch push
        │
        ├──► GitHub Actions: ci.yml
        │    (TypeScript check matrix: backend + web + mobile)
        │
        ├──► deploy-backend.yml
        │    (packages/backend/** 변경 시 → Cloudflare Workers)
        │
        └──► deploy-web.yml
             (packages/web/** 변경 시 → Cloudflare Pages)
```

- `develop` → 자동 배포 (CI/CD)
- `main` ← `develop` 수동 머지 (리뷰 후)
