# 현재 상태

- 브랜치: develop
- 마지막 루프: 2026-04-10 — P27 + P28 + P29 전체 완료
- 최근 주요 변경:
  - 모바일: gift/received 수락 시 Alert → Animated 토스트
  - 웹: GiftsPage 수락/거절 시 토스트 배너 추가
  - 백엔드: GET /api/alarm에 voice_profile_id 필터 추가 (count 쿼리 JOIN 포함)
  - 모바일: message/[id].tsx 상세 화면 신규 (텍스트 전문, 재생, 알람 설정, 새 메시지 생성)
  - 모바일: library 탭에서 메시지 카드 탭 시 상세 화면으로 이동
  - 전체 typecheck/build 통과 확인
- 알려진 이슈:
  - [blocked] Perso API 404 (외부 API 문서 접근 필요)
  - [blocked] P1 ElevenLabs 통합 테스트 (API 키 + 실환경 필요)
  - 웹/모바일 미배포
- 다음 루프: 새 P30 항목 생성 필요
