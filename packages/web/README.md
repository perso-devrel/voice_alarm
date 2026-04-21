# VoiceAlarm Web Dashboard

React + TypeScript + Vite + Tailwind CSS 기반 웹 관리 대시보드.

## 기술 스택

- React 19 + TypeScript
- Vite (빌드/개발 서버)
- Tailwind CSS v4
- TanStack Query (서버 상태 관리)
- Axios (HTTP 클라이언트)

## 로컬 실행

```bash
cd packages/web
npm run dev       # Vite dev server (localhost:5173)
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|---|---|---|
| `VITE_API_URL` | 백엔드 API URL | `http://localhost:8787` |

## 빌드

```bash
npm run build     # tsc + vite build → dist/
npm run preview   # 빌드 결과 미리보기
```

## 테스트

```bash
npm test          # vitest run
npm run typecheck # tsc --noEmit
```

## 주요 화면

- 대시보드: 통계 요약
- 음성 관리: 프로필 목록, 화자 감지
- 메시지: TTS 생성, 프리셋
- 알람 설정: CRUD, 모드(TTS/원본) 전환
- 가족 알람: 그룹 멤버 선택, 텍스트/음성 알람
- 캐릭터: XP 진행도, 성장 단계
- 설정: 이용권 코드, 구독 관리
