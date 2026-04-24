# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P7 백엔드 테스트 커버리지 Batch 1+2+3 완료 (6파일, 52 새 tests, 7 기존 실패 수정, 1 방어적 코드 수정)
- 현재 Phase: **P7 완료. BACKLOG 자가 생성 풀에서 다음 항목 선택 필요**
- 전체 typecheck 통과, 538/538 tests 통과 (0 failures)

## 완료된 리팩토링

- **P0 Phase 1-A**: packages/web 전체 삭제 완료.
- **P0 Phase 1-B**: Pretendard 폰트 적용 완료.
- **P0 Phase 1-B-2**: 전체 앱 fontWeight→fontFamily 마이그레이션 완료 (29개 파일, 3배치).
- **P0 Phase 1-C**: 탭 8→5 축소 완료 (Home/Voices/Alarms/People/Settings).
- **P1**: People 탭 통합 완료 (세그먼트, 초대코드, 가족 알람, 컴포넌트 추출, i18n).
- **P2**: 캐릭터 시스템 완료 (DB 스키마, 스트릭, XP, 능력치, API, 프론트엔드, 나무 대사).
- **P3**: R2 스토리지 + FCM 푸시 + 배포 설정 완료.
- **P4**: 온보딩 + 알람 정확도 + 오프라인 캐싱 완료.
- **P5**: 다크모드 + 커플뷰 + 카드일관성 + 알람UI + 홈레이아웃 + 스플래시 + 진동 + 접속시간 + 정렬 + 접근성 3배치 + 이모지 + 레이아웃 전체 완료.
- **P6 TypeScript 엄격 모드**: backend `strict: true` 전환, `any` 0건 확인.
- **P7 테스트 Batch 1**: push.test.ts (14), streak.test.ts (17), fcm.test.ts (11) — 42 tests 추가.
- **P7 테스트 Batch 2**: character.xp.test.ts 4건 + voice 3건 기존 실패 수정. voice.ts getStorage 방어 코드.
- **P7 테스트 Batch 3**: r2-storage.test.ts (10) — R2Bucket mock 기반 store/get/delete 검증.

## 남은 리팩토링 목표

1. 자가 생성 풀에서 다음 항목 선택

## GitHub 이슈 매핑
- P0: #172, P1: #173, P2: #174, P3: #175, P4: #176

## 다음 루프 지시

**P7 전체 완료 (538 tests, 0 failures). 자가 생성 풀에서 다음 항목을 진행하라.**

## 알려진 이슈
- [blocked] Perso API 404
- [blocked] ElevenLabs 통합 테스트
- FontFamily/fontForWeight 중복 (fontForWeight는 남아 있으나 현재 사용처 없음)
- alarmForm.ts 검증 에러 메시지 하드코딩 한국어 (i18n 리팩토링 필요)
- expo-haptics는 실 디바이스/에뮬레이터에서만 동작 (웹 미지원)
