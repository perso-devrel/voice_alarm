# VoiceAlarm 프로젝트 현황

> 마지막 업데이트: 2026-04-10 (Ralph Loop P39 완료)

---

## 배포 상태

| 항목 | URL | 상태 |
|------|-----|------|
| 백엔드 (Cloudflare Workers) | `https://voice-alarm-api.voicealarm.workers.dev` | ✅ 운영 중 |
| 웹 대시보드 (Cloudflare Pages) | `https://voice-alarm-web.pages.dev` | ✅ 운영 중 |
| 모바일 앱 (Expo) | EAS Build 필요 | 미배포 |
| CI (GitHub Actions) | develop/main 푸시 시 자동 실행 | ⚠️ mobile typecheck 수정됨 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모바일 | React Native (Expo SDK 54) + expo-router v6 |
| 웹 | React + TypeScript + Vite + Tailwind CSS |
| 백엔드 | Cloudflare Workers + Hono + Turso (libSQL) |
| AI (음성 클론) | Perso.ai API (1차) + ElevenLabs API (보조) |
| 인증 | Google OAuth + Apple Sign-In (Firebase 제거) |
| 상태 관리 | Zustand + TanStack Query |
| 자동화 | Ralph Loop + GitHub Actions CI/CD |

---

## 알려진 이슈 / 블로커

| 우선순위 | 항목 | 상태 |
|---------|------|------|
| 🔴 높음 | Perso API 404 — 실제 엔드포인트 불명 | 외부 문서 필요, blocked |
| 🔴 높음 | ElevenLabs 통합 테스트 — 실제 API 키 + 오디오 파일 필요 | test/ 폴더 비어있음 |
| 🟡 중간 | 웹 Google OAuth — Pages 도메인을 승인 origin에 추가 필요 | Google Console 설정 |
| 🟡 중간 | 모바일 APK — 현재 빌드가 gift/friends 기능 이전 버전 | EAS 재빌드 필요 |

---

## 구현 완료 기능

### 핵심 기능
- [x] Google OAuth + Apple Sign-In (Firebase 없이)
- [x] 음성 프로필 등록 (녹음 / 파일 업로드 / 화자 분리)
- [x] 음성 클론 → TTS 메시지 생성
- [x] 알람 생성 / 편집 / 삭제 / 토글
- [x] 알람 스누즈 (N분 후 재알림)
- [x] 오디오 로컬 캐싱 (오프라인 재생)

### 소셜 기능
- [x] 친구 시스템 (이메일 검색 → 요청 → 수락)
- [x] 선물하기 — 메시지를 친구에게 선물
- [x] 상호 알람 — 친구에게 알람 설정해주기
- [x] 받은 선물 수락 → 즉시 알람 설정

### UX / 품질
- [x] 파형(Waveform) 시각화 플레이어 + 스크럽 시크
- [x] 전체 화면 스켈레톤 로딩 UI
- [x] 토스트 알림 시스템 (Alert 대신 인앱 배너)
- [x] 스와이프 삭제 제스처 (알람 / 음성 / 라이브러리)
- [x] Pull-to-refresh (알람 / 음성 / 라이브러리)
- [x] 낙관적 업데이트 (웹 전체)
- [x] 다크모드 (웹)
- [x] 한국어 / 영어 i18n

### 백엔드
- [x] Rate limiting 미들웨어
- [x] 구조화 로깅 + 요청 시간 메트릭
- [x] CORS 화이트리스트 + Body 512KB 제한
- [x] DB 인덱스 최적화
- [x] 계정 삭제 (연관 데이터 cascade 삭제)
- [x] Auth 에러 코드 세분화 (`TOKEN_EXPIRED`, `AUDIENCE_MISMATCH` 등)
- [x] **212개 백엔드 유닛 테스트 전체 통과**

---

## 미완료 / 향후 작업

| 항목 | 비고 |
|------|------|
| ElevenLabs 통합 테스트 | API 키 + test/ 오디오 파일 필요 |
| Perso API 엔드포인트 수정 | 외부 문서 확인 후 `perso.ts` URL 수정 |
| 새 APK 빌드 | `eas build --platform android` |
| 웹 Google OAuth 도메인 등록 | Google Console → 승인된 JavaScript 원본에 Pages 도메인 추가 |
| Sentry 에러 모니터링 | 선택 사항 |

---

## 프로젝트 구조

```
alarm/
├── apps/
│   └── mobile/          # React Native (Expo) — 루트 workspace 제외
├── packages/
│   ├── backend/         # Cloudflare Workers + Hono
│   └── web/             # React 웹 대시보드
├── .ralph/              # Ralph Loop 자동화 하네스
│   ├── PROMPT.md        # Claude 자율 개발 지시
│   ├── BACKLOG.md       # P0-P39 전체 완료
│   ├── STATE.md         # 마지막 실행 상태
│   └── JOURNAL/         # 루프별 작업 기록
├── .github/workflows/   # CI/CD (typecheck + deploy)
└── review.md            # 이 파일
```

---

## 환경변수 설정

### 모바일 (`apps/mobile/.env`)
```
EXPO_PUBLIC_API_URL=https://voice-alarm-api.voicealarm.workers.dev
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
```

### 웹 (`packages/web/.env`)
```
VITE_API_URL=https://voice-alarm-api.voicealarm.workers.dev
VITE_GOOGLE_CLIENT_ID=...
```

### 백엔드 (`packages/backend/.dev.vars` — 로컬 전용)
```
ELEVENLABS_API_KEY=...
PERSO_API_KEY=...
TURSO_URL=...
TURSO_AUTH_TOKEN=...
GOOGLE_CLIENT_ID=...
```

> GitHub Secrets에도 동일한 키 등록 필요 (CI/CD 자동배포용)

---

## 최근 변경 (P38–P39, 2026-04-10)

**P38 — 계정 삭제 + Auth 에러 코드**
- 모바일 설정 화면에 계정 삭제 기능 추가 (텍스트 입력 확인 방식)
- 웹 계정 삭제 성공 시 `/login` 리다이렉트 (reload → href)
- 백엔드 auth 미들웨어에 에러 코드 필드 추가

**P39 — Toast 공통 컴포넌트 추출**
- `useToast` hook + `Toast` 컴포넌트 신규 추출
- 모바일 전체(13개 화면)의 에러 `Alert.alert` → 토스트 배너로 통일
