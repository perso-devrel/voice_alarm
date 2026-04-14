# P17: 활동 타임라인 + 사용자 검색 + 자동완성

## 완료 항목

### 백엔드: stats/activity 에 voice_profiles 추가
- voice_profiles 테이블에서 최근 5개 조회 후 활동 목록에 합산
- type: 'voice', summary: '음성 "이름" (상태)'

### 웹: Activity 타입 확장
- api.ts Activity.type에 'voice' 추가
- DashboardPage TYPE_META에 voice 항목 추가 (🎙️ 음성, voices 페이지)

### 백엔드: 사용자 검색 API
- GET /api/user/search?q= — 이메일 LIKE 검색, 최소 2글자, 본인 제외, 최대 10명
- google_id, email, name, picture 반환

### 웹: FriendsPage 이메일 자동완성
- 300ms debounce로 searchUsers 호출
- 드롭다운에 avatar + name + email 표시
- onMouseDown으로 선택 (blur보다 먼저 실행)
- onBlur 200ms 딜레이로 클릭 가능하게 처리

## 검증
- backend/web/mobile 전부 tsc --noEmit 통과
- web build 통과 (253ms)

## 변경 파일
- packages/backend/src/routes/stats.ts
- packages/backend/src/routes/user.ts
- packages/web/src/services/api.ts
- packages/web/src/pages/DashboardPage.tsx
- packages/web/src/pages/FriendsPage.tsx

## P16 추가 완료
- 모바일 비활성 알람 시각적 구분 (strikethrough)
- 모바일 설정 계정 정보/동적 버전
- 모바일 친구 프로필 화면
