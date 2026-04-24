# 현재 상태

- 브랜치: develop_loop
- 마지막 루프: 2026-04-24 — P5 완료 + P6 TypeScript 엄격 모드 강화 완료 (9파일)
- 현재 Phase: **P6 완료. BACKLOG 자가 생성 풀에서 다음 항목 선택 필요**
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
- **P5 홈 화면 레이아웃 + 접근성**: 섹션 구분선, 간격 위계, 탭 화면 전체 접근성 라벨 ~36개 추가.
- **P5 스플래시 스크린 + 앱 정보**: splash backgroundColor → coral, 설정 앱 정보 섹션 강화 (링크, 문의, 푸터)
- **P5 진동 패턴 선택**: DB 마이그레이션 15 + 백엔드 API + create/edit 화면 UI + expo-haptics 미리보기 + i18n
- **P5 친구 마지막 접속 시간**: DB 마이그레이션 16 + last_active_at 갱신 + friend list 응답 + formatLastSeen 유틸 + People 탭 UI + i18n
- **P5 알람 정렬 + 즐겨찾기 + 접근성 Batch 1**: 알람 시간순 정렬 + 라이브러리 즐겨찾기 상단 고정 + alarm/create·edit·library 접근성 ~46개 라벨
- **P5 접근성 Batch 2**: voice/record, message/create, dub/translate, family-alarm/create, voice/picker — ~62개 라벨 + i18n 13키
- **P5 접근성 Batch 3**: voice/upload, voice/diarize, character/index, player, voice/[id], friend/[id] — ~51개 라벨 + i18n 43키 + friend/[id] 다크모드 수정
- **P5 이모지 단독 점검**: library 카테고리 뱃지/필터 i18n 10키, player 장식 이모지 a11y 처리
- **P5 한국어/영어 레이아웃**: segment numberOfLines, quickDays flexWrap, FamilyMemberRow name flexShrink
- **P6 TypeScript 엄격 모드**: backend `strict: true` 전환, `any` 0건, `unknown` 올바른 사용 확인

## 남은 리팩토링 목표

1. P5, P6 전체 완료. 자가 생성 풀에서 "백엔드 테스트 커버리지 확장" 진행 예정.

## GitHub 이슈 매핑
- P0: #172, P1: #173, P2: #174, P3: #175, P4: #176

## 다음 루프 지시

**P5+P6 전체 완료. BACKLOG 자가 생성 풀에서 "백엔드 테스트 커버리지 확장"을 다음 작업으로 진행하라.**

## 알려진 이슈
- [blocked] Perso API 404
- [blocked] ElevenLabs 통합 테스트
- FontFamily/fontForWeight 중복 (fontForWeight는 남아 있으나 현재 사용처 없음)
- alarmForm.ts 검증 에러 메시지 하드코딩 한국어 (i18n 리팩토링 필요)
- expo-haptics는 실 디바이스/에뮬레이터에서만 동작 (웹 미지원)
