# VoiceAlarm Mobile App

React Native (Expo) + expo-dev-client 기반 모바일 앱.

## 기술 스택

- React Native + Expo SDK
- expo-router (파일 기반 네비게이션)
- TanStack Query (서버 상태)
- i18next (한국어/영어)
- zustand (로컬 상태)

## 개발 환경 설정

```bash
cd apps/mobile
npx expo start            # Expo 개발 서버
npx expo start --android  # Android 에뮬레이터
npx expo start --ios      # iOS 시뮬레이터
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | 백엔드 API URL | `http://localhost:8787` |

## 테스트

```bash
npm test          # jest
npm run typecheck # tsc --noEmit
```

## 주요 탭

| 탭 | 아이콘 | 설명 |
|---|---|---|
| 홈 | 🏠 | 대시보드 + 빠른 시작 |
| 음성 | 🎙️ | 프로필 관리 + 화자 감지 |
| 알람 | ⏰ | 알람 CRUD + 모드 전환 |
| 친구 | 👥 | 친구 추가/관리 |
| 가족 | 👨‍👩‍👧 | 가족 알람 편집 |
| 캐릭터 | 🌱 | 성장 게이미피케이션 |
| 보관함 | 📚 | 수신 메시지 라이브러리 |
| 설정 | ⚙️ | 계정/알림/캐시 설정 |

## 프로젝트 구조

```
apps/mobile/
├── app/          # expo-router 파일 기반 라우트
│   ├── (tabs)/   # 탭 네비게이션
│   ├── alarm/    # 알람 생성/편집 모달
│   ├── voice/    # 음성 녹음/업로드/화자분리
│   └── ...
├── src/
│   ├── components/  # 공용 컴포넌트
│   ├── constants/   # 테마, 설정
│   ├── hooks/       # useAuth 등
│   ├── i18n/        # 한국어/영어 리소스
│   ├── lib/         # 순수 함수 (alarmForm, character, ...)
│   ├── services/    # API 클라이언트
│   └── stores/      # zustand 스토어
└── test/          # jest 테스트
```
