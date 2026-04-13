# VoiceAlarm E2E 시나리오 가이드

수동 테스트용 E2E 시나리오. 두 명의 사용자(A, B)로 전체 흐름을 검증한다.

## 사전 준비

- 백엔드: `https://voice-alarm-api.voicealarm.workers.dev` (또는 로컬 `wrangler dev`)
- DB 초기화: `GET /api/init-db` 호출 (Turso 테이블 생성)
- 테스트 음성 파일: `test/` 폴더에 MP3/WAV 준비
- Google OAuth 토큰 2개 (사용자 A, B)
- HTTP 클라이언트: curl, httpie, 또는 Postman

## 인증 토큰 설정

```bash
# Google OAuth 로그인 후 발급받은 ID 토큰
TOKEN_A="Bearer <user-a-google-id-token>"
TOKEN_B="Bearer <user-b-google-id-token>"
BASE="https://voice-alarm-api.voicealarm.workers.dev/api"
```

---

## 시나리오 1: 기본 흐름 (로그인 → 음성 등록 → 메시지 → 알람)

### 1-1. 사용자 프로필 생성

```bash
# 사용자 A 프로필 (자동 생성됨)
curl -H "Authorization: $TOKEN_A" $BASE/user/me
# 기대: 200, { user: { id, email, name, plan: "free" }, stats: { voices, alarms, messages } }

# 사용자 B 프로필
curl -H "Authorization: $TOKEN_B" $BASE/user/me
```

**체크포인트:**
- [ ] 200 응답, user 객체에 email/name 포함
- [ ] stats 필드에 voices=0, alarms=0, messages=0

### 1-2. 음성 프로필 클론

```bash
# 사용자 A가 음성 파일로 클론 요청
curl -X POST -H "Authorization: $TOKEN_A" \
  -F "audio=@test/sample.mp3" \
  -F "name=엄마 목소리" \
  -F "provider=elevenlabs" \
  $BASE/voice/clone
# 기대: 201, { id, name, provider, status: "processing"|"ready" }
```

**체크포인트:**
- [ ] 201 응답, voice profile id 반환
- [ ] provider가 "elevenlabs"
- [ ] `GET /voice` 로 목록에 표시 확인

### 1-3. TTS 메시지 생성

```bash
# 프리셋 목록 확인
curl -H "Authorization: $TOKEN_A" $BASE/tts/presets
# 기대: 카테고리별 메시지 템플릿 (morning, cheer, love 등)

# TTS 생성
curl -X POST -H "Authorization: $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"voice_id": "<voice-id>", "text": "좋은 아침이야! 오늘도 화이팅!", "category": "morning"}' \
  $BASE/tts/generate
# 기대: 200, { message_id, audio_base64 }
```

**체크포인트:**
- [ ] 200 응답, message_id + audio_base64 반환
- [ ] audio_base64를 디코딩하면 유효한 오디오 파일
- [ ] `GET /tts/messages` 에 해당 메시지 표시

### 1-4. 알람 생성

```bash
curl -X POST -H "Authorization: $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"message_id": "<message-id>", "time": "07:30", "repeat_days": [1,2,3,4,5], "label": "출근 알람"}' \
  $BASE/alarm
# 기대: 201, { id, time, repeat_days, is_active: true }
```

**체크포인트:**
- [ ] 201 응답
- [ ] `GET /alarm` 에서 알람 표시
- [ ] is_active 기본값 true

### 1-5. 라이브러리 확인

```bash
curl -H "Authorization: $TOKEN_A" $BASE/library
# 기대: 생성한 메시지가 라이브러리에 표시

# 즐겨찾기 토글
curl -X PATCH -H "Authorization: $TOKEN_A" $BASE/library/<message-id>/favorite
```

**체크포인트:**
- [ ] 라이브러리에 메시지 1개 이상
- [ ] 즐겨찾기 토글 후 is_favorite 변경 확인

---

## 시나리오 2: 소셜 흐름 (친구 추가 → 선물 → 상호 알람)

### 2-1. 친구 요청 (A → B)

```bash
# A가 B에게 친구 요청
curl -X POST -H "Authorization: $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"email": "<user-b-email>"}' \
  $BASE/friend
# 기대: 201, { id, status: "pending" }
```

### 2-2. B가 친구 요청 수락

```bash
# B의 대기중인 요청 확인
curl -H "Authorization: $TOKEN_B" $BASE/friend/pending
# 기대: 요청 1개 (from A)

# B가 수락
curl -X PATCH -H "Authorization: $TOKEN_B" $BASE/friend/<friendship-id>/accept
# 기대: 200, status: "accepted"
```

**체크포인트:**
- [ ] 양쪽 모두 `GET /friend/list` 에서 상대방 표시
- [ ] pending 목록에서 사라짐

### 2-3. A가 B에게 선물 보내기

```bash
# A가 만든 메시지를 B에게 선물
curl -X POST -H "Authorization: $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"email": "<user-b-email>", "message_id": "<message-id>", "note": "좋은 아침 메시지 선물이야!"}' \
  $BASE/gift
# 기대: 201, { id, status: "pending" }
```

### 2-4. B가 선물 수락

```bash
# B의 받은 선물 확인
curl -H "Authorization: $TOKEN_B" $BASE/gift/received
# 기대: 선물 1개 (from A)

# B가 수락
curl -X PATCH -H "Authorization: $TOKEN_B" $BASE/gift/<gift-id>/accept
# 기대: 200, status: "accepted"

# B의 라이브러리에 선물 메시지 추가 확인
curl -H "Authorization: $TOKEN_B" $BASE/library
```

**체크포인트:**
- [ ] B의 라이브러리에 A가 보낸 메시지 표시
- [ ] `GET /gift/sent` (A측) 에서 status "accepted"

### 2-5. A가 B에게 알람 설정 (상호 알람)

```bash
curl -X POST -H "Authorization: $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"message_id": "<message-id>", "time": "08:00", "target_user_id": "<user-b-id>", "label": "B를 위한 아침 알람"}' \
  $BASE/alarm
# 기대: 201, target_user_id 포함
```

**체크포인트:**
- [ ] 친구 관계가 아닌 사용자에게는 400 에러
- [ ] B의 `GET /alarm` 에서 A가 설정한 알람 표시
- [ ] A의 `GET /alarm` 에서도 자신이 만든 알람으로 표시

---

## 시나리오 3: 에러 케이스 검증

### 3-1. 인증 실패

```bash
curl $BASE/user/me
# 기대: 401 Unauthorized

curl -H "Authorization: Bearer invalid-token" $BASE/user/me
# 기대: 401 Unauthorized
```

### 3-2. 잘못된 입력

```bash
# 잘못된 시간 형식
curl -X POST -H "Authorization: $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"message_id": "x", "time": "25:99"}' \
  $BASE/alarm
# 기대: 400, time 관련 에러 메시지

# 잘못된 이메일 형식
curl -X POST -H "Authorization: $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email"}' \
  $BASE/friend
# 기대: 400, 이메일 형식 에러

# 잘못된 카테고리
curl -X POST -H "Authorization: $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"voice_id": "x", "text": "test", "category": "invalid"}' \
  $BASE/tts/generate
# 기대: 400, 카테고리 에러

# 친구가 아닌 사용자에게 선물
curl -X POST -H "Authorization: $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"email": "stranger@example.com", "message_id": "x"}' \
  $BASE/gift
# 기대: 400 또는 403, 친구 관계 필요
```

### 3-3. 권한 검증

```bash
# B가 A의 알람 삭제 시도
curl -X DELETE -H "Authorization: $TOKEN_B" $BASE/alarm/<a-alarm-id>
# 기대: 403 또는 404

# B가 A의 음성 프로필 삭제 시도
curl -X DELETE -H "Authorization: $TOKEN_B" $BASE/voice/<a-voice-id>
# 기대: 403 또는 404
```

---

## 시나리오 4: 모바일 앱 수동 테스트

Expo 개발 서버에서 실행: `cd apps/mobile && npx expo start`

### 화면 흐름 체크리스트

1. **온보딩**
   - [ ] 앱 첫 실행 시 온보딩 화면 표시
   - [ ] Google 로그인 → 홈 화면으로 이동

2. **홈 (대시보드)**
   - [ ] 음성 프로필 수, 알람 수, 메시지 수 표시
   - [ ] "받은 선물", "친구 관리" 바로가기 동작

3. **음성 탭**
   - [ ] 음성 목록 표시 (없으면 빈 상태 UI)
   - [ ] 녹음 버튼 → voice/record 화면 이동
   - [ ] 업로드 버튼 → voice/upload 화면 이동
   - [ ] 에러 시 ErrorView 표시

4. **라이브러리 탭**
   - [ ] 메시지 목록 표시 (없으면 빈 상태 UI)
   - [ ] 즐겨찾기 토글 동작
   - [ ] 메시지 재생 → player 화면

5. **알람 탭**
   - [ ] 알람 목록 (본인 + 타인이 설정한 알람)
   - [ ] 새 알람 만들기 → alarm/create 화면
   - [ ] "누구에게?" 선택 (친구 목록에서)
   - [ ] 알람 활성/비활성 토글

6. **친구 탭**
   - [ ] 친구 목록 표시
   - [ ] 이메일로 친구 추가
   - [ ] 대기 중인 요청 수락/거절

7. **메시지 생성**
   - [ ] 음성 선택 → 텍스트 입력 → TTS 생성
   - [ ] "선물하기" 버튼 → 친구 선택 → 전송

8. **받은 선물**
   - [ ] 선물 목록 표시
   - [ ] 수락 → 라이브러리에 추가
   - [ ] 거절

---

## 결과 기록 양식

| 시나리오 | 테스트 일시 | 결과 | 비고 |
|---------|-----------|------|------|
| 1-1 프로필 | | PASS/FAIL | |
| 1-2 음성 클론 | | PASS/FAIL | |
| 1-3 TTS 생성 | | PASS/FAIL | |
| 1-4 알람 생성 | | PASS/FAIL | |
| 1-5 라이브러리 | | PASS/FAIL | |
| 2-1 친구 요청 | | PASS/FAIL | |
| 2-2 친구 수락 | | PASS/FAIL | |
| 2-3 선물 보내기 | | PASS/FAIL | |
| 2-4 선물 수락 | | PASS/FAIL | |
| 2-5 상호 알람 | | PASS/FAIL | |
| 3-1 인증 에러 | | PASS/FAIL | |
| 3-2 입력 에러 | | PASS/FAIL | |
| 3-3 권한 에러 | | PASS/FAIL | |
