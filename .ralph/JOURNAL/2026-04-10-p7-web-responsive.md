---
date: 2026-04-10
slug: p7-web-responsive
---

# P7: 웹 반응형 모바일 레이아웃

## 집은 BACKLOG 항목
- P7: 웹 반응형 모바일 레이아웃 (사이드바 → 하단 탭바 전환)

## 접근

Tailwind md: breakpoint (768px) 기준으로 레이아웃 분기:

**Desktop (md+)**: 기존 좌측 사이드바 유지 (w-64, flex-col)
**Mobile (<md)**: 
- 사이드바 `hidden md:flex`로 숨김
- 상단 헤더 추가: 로고 + 로그아웃 버튼
- 하단 고정 탭바 (`fixed bottom-0`) — 6개 NAV_ITEMS 아이콘 + 라벨
- 메인 콘텐츠 하단 패딩 `pb-20` (탭바 가림 방지)
- 메인 콘텐츠 패딩 `p-4 md:p-8` (모바일에서 좀 더 촘촘하게)

대안: 햄버거 메뉴 슬라이드아웃 — 탭 수가 6개로 적어서 하단 탭바가 더 직관적이라 판단.

## 변경 파일
1. `packages/web/src/App.tsx` — 반응형 레이아웃 (sidebar hidden on mobile, bottom tab bar, mobile header)

## 검증 결과
- Web `npx tsc --noEmit` — 통과
- Web `npm run build` — 통과 (244ms)

## 다음 루프 주의사항
- P7 나머지 항목: 알람 스누즈, API 캐싱, 파형 시각화
- 탭바 아이템이 6개인데, 좁은 화면에서 label이 잘릴 수 있음 — 추후 아이콘만 모드 고려 가능
