# Changelog

## [Unreleased] - develop

### Added
- **Friends system**: Email-based friend requests with bidirectional accept model
  - `friendships` table, POST/GET/PATCH/DELETE endpoints
  - Mobile friends tab with request/accept UI
  - Web FriendsPage
- **Gift system**: Share voice messages with friends
  - `gifts` table, send/receive/accept/reject endpoints
  - Friendship validation on gift send
  - Mobile gift received screen, web GiftsPage
- **Cross-user alarms**: Set alarms for friends
  - `target_user_id` on alarms table
  - Friendship check before cross-user alarm creation
  - Recipient sees alarm in their list with creator info
- **Input validation**: All backend routes validate email format, provider, time, repeat_days, category
- **Error UI consistency**: `QueryStateView` component applied to all mobile screens
  - Mutation error alerts on alarms, voices, library
- **E2E scenario guide**: `docs/E2E_SCENARIO_GUIDE.md` with curl-based test steps
- **README**: Full project documentation (setup, deploy, API reference)
- **Ralph Loop harness**: Autonomous iteration system with GitHub Actions auto-deploy
- **CI/CD workflows**: TypeScript check matrix, backend deploy to Workers, web deploy to Pages

### Infrastructure
- Turso DB `voice-alarm-devrel` deployed
- Backend deployed to `https://voice-alarm-api.voicealarm.workers.dev`
- Web dashboard: pending Cloudflare Pages deploy

### Known Issues
- Perso API returns 404 (endpoint path unverified)
- Web/mobile apps not yet deployed
- Production DB may need `init-db` re-invocation after schema changes

## [0.1.0] - 2026-04-10

### Added
- Initial project scaffold (monorepo)
- React Native (Expo) mobile app with expo-router
- Cloudflare Workers backend with Hono + Turso
- React + Vite + Tailwind web dashboard
- Google OAuth + Apple Sign-In authentication
- Voice cloning via Perso.ai and ElevenLabs
- Speaker diarization endpoint
- TTS message generation with daily quota limits
- Alarm CRUD with repeat days and snooze
- Message library with favorites
- Plan-based limits (free/plus/family)
