# 현재 상태

- 브랜치: develop (Ralph harness 시작 직전)
- 마지막 사람 터치: 야간 Ralph 모드 첫 가동 직전
- 최근 주요 결정:
  - Firebase 제거 → Google OAuth + Apple Sign-In 직접 구현
  - 모노레포 워크스페이스에서 apps/mobile 분리 (Metro 호이스팅 충돌 회피)
  - 백엔드 Cloudflare Workers 배포 완료 (https://voice-alarm-api.voicealarm.workers.dev)
- 알려진 이슈:
  - Perso API `/v1/voices` 엔드포인트가 404 (실제 경로 확인 필요, ElevenLabs는 정상)
  - 웹/모바일 미배포
  - 선물하기/친구/상호 알람 기능 미구현 (사용자 핵심 목표)
- 다음 루프가 기대하는 출발점: BACKLOG 의 P0 최상단 (선물하기 기능 백엔드 스키마)
