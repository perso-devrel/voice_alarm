# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P5 알람 시간 설정 UI 개선 (AM/PM 표시, 남은시간 헬퍼, i18n 17개 키, 터치타겟 44px, 접근성 라벨)
- 현재 Phase: **P5 UI 폴리시 진행 중. 다음: 홈 화면 레이아웃 정리 / 접근성 점검**
- 전체 typecheck 통과

## 완료된 리팩토링

- **P0 Phase 1-A**: packages/web 전체 삭제 완료.
- **P0 Phase 1-B**: Pretendard 폰트 적용 완료.
- **P0 Phase 1-B-2**: 전체 앱 fontWeight→fontFamily 마이그레이션 완료 (29개 파일, 3배치).
- **P0 Phase 1-C**: 탭 8→5 축소 완료 (Home/Voices/Alarms/People/Settings).
- **P1**: People 탭 통합 완료 (세그먼트, 초대코드, 가족 알람, 컴포넌트 추출, i18n).
- **P2**: 캐릭터 시스템 완료 (DB 스키마, 스트릭, XP, 능력치, API, 프론트엔드, 나무 대사).
- **P3**: R2 스토리지 + FCM 푸시 + 배포 설정 완료.
- **P4**: 온보딩 + 알람 정확도 + 오프라인 캐싱 완료.
- **P5 다크모드 전체 완료**: 33+ 파일, 561+ Colors.light 참조 제거.
- **P5 커플 뷰**: CoupleView 컴포넌트 — 2인 가족 그룹 전용 카드 레이아웃.
- **P5 카드 일관성**: 7개 카드에 shadow 토큰 추가, marginBottom 통일, settings.tsx 매직넘버→토큰.
- **P5 알람 시간 설정 UI**: AM/PM 표시, 남은 시간 헬퍼, 하드코딩 한국어 7개→i18n, 터치타겟 44px, 접근성 라벨 4개.

## 남은 리팩토링 목표

1. P5: 홈 화면 레이아웃 정리 (위젯 간 간격, 섹션 구분선, 시각적 위계)
2. P5: 접근성 점검 (accessibilityLabel 누락, 이모지 라벨 병기)
3. P5: 소규모 기능 구현 (스플래시 스크린, 진동 패턴, 앱 정보 등)

## GitHub 이슈 매핑
- P0: #172, P1: #173, P2: #174, P3: #175, P4: #176

## 다음 루프 지시

**P5 홈 화면 레이아웃 정리로 진행하라.**

## 알려진 이슈
- [blocked] Perso API 404
- [blocked] ElevenLabs 통합 테스트
- FontFamily/fontForWeight 중복 (fontForWeight는 남아 있으나 현재 사용처 없음)
- alarmForm.ts 검증 에러 메시지 하드코딩 한국어 (i18n 리팩토링 필요)
