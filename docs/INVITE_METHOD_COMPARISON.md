# 가족 플랜 초대 방식 비교 (Phase 5 #32)

## 목표
가족 플랜 그룹 owner 가 최대 6명의 멤버를 안전하고 UX 부담 없이 초대할 수 있는 방법을 정한다.

## 비교

| 기준 | 초대 코드 (6자리 숫자) | 이메일 초대 | 링크 초대 (딥링크) |
|---|---|---|---|
| UX (전달 편의) | ⭐⭐⭐ 말로 전달 가능, 6자리라 입력 간단 | ⭐⭐ 이메일 오타·수신지연 위험 | ⭐⭐⭐ 원클릭 수락 |
| 보안 (탈취 내성) | ⭐⭐ 브루트포스 가능 — 짧은 만료로 완화 | ⭐⭐⭐ 본인 메일함 소유자만 | ⭐⭐ 링크 유출 시 아무나 수락 |
| 구현 난이도 | ⭐⭐⭐ 로우 | ⭐ 메일 발송 인프라 필요 | ⭐⭐ 딥링크 라우팅 필요 |
| 이메일 수집 의존 | 없음 | 필수 | 없음 (코드 기반 이면) |
| 오프라인 공유 | 가능 (말로/쪽지) | 불가 | 불가 |
| 본 프로젝트 적합도 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

## 결정: 초대 코드 + 딥링크 하이브리드

6자리 숫자 코드 1개를 발급하고, 해당 코드를 그대로 임베드한 딥링크/웹 URL 을 함께 반환한다.

- **코드 포맷**: `[0-9]{6}` (leading zero 허용, 예: `004312`)
- **만료**: 10분 — 탈취 내성을 보안적으로 보완
- **일회용**: 수락 1건 성공 시 `status='used'`
- **링크**:
  - 모바일 앱: `voicealarm://invite/{code}`
  - 웹 fallback: `https://voicealarm.pages.dev/invite/{code}`
- **전달 방식**:
  - 모바일에 앱이 있으면 딥링크 클릭 → 자동 입력
  - 앱이 없거나 웹 환경이면 웹 URL → 로그인 후 코드 입력 UI
  - 링크 없이 코드만 복사해서 오프라인 전달도 가능

### 이유
1. 이메일 수집 없이 구현 가능 → 프라이버시 관점에서 유리
2. 말/쪽지로도 전달 가능 → 가족 구성원 간 자연스러운 공유 맥락
3. 딥링크를 덧붙여 UX 를 끌어올림 → 두 방식의 장점 결합

### 위험 & 완화
- **브루트포스**: 1,000,000 경우의 수 × 10분 만료 × pending 상태 유일. 추후 `acceptInvite` 엔드포인트에 rate limit(기본 분당 60회) 적용 상태임 → 사실상 탐색 비현실적. 필요 시 공격 탐지 시 해당 코드 즉시 revoke.
- **링크 유출**: 10분 내에 유출되어도 일회용이라 1명만 수락 가능. 다수 초대가 필요한 케이스는 owner 가 여러 코드 발급.
- **만료 누적**: 매 수락/발급 시 만료된 pending 을 `status='expired'` 로 lazy 전환 — 배치 작업 불필요.

## 스키마 (마이그레이션 #9 `plan-group-invites`)

```sql
CREATE TABLE plan_group_invites (
  id TEXT PRIMARY KEY,
  plan_group_id TEXT NOT NULL REFERENCES plan_groups(id),
  inviter_user_id TEXT NOT NULL REFERENCES users(id),
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','used','revoked','expired')),
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_by_user_id TEXT REFERENCES users(id),
  used_at TEXT
);
CREATE UNIQUE INDEX idx_plan_group_invites_code ON plan_group_invites(code);
CREATE INDEX idx_plan_group_invites_group ON plan_group_invites(plan_group_id);
CREATE INDEX idx_plan_group_invites_status ON plan_group_invites(status);
```

## API 요약

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/family/invites` | owner 가 `{ plan_group_id? }` 로 초대 발급. plan_group_id 생략 시 활성 그룹 자동 resolve. |
| GET | `/api/family/invites` | owner 본인 그룹의 초대 목록 |
| POST | `/api/family/invites/:code/accept` | 초대 수락 → 그룹 멤버 추가 |
| POST | `/api/family/invites/:code/revoke` | 발급자만, pending 만 |

## 후속 이슈
- **#33 참여/탈퇴·소유자 권한 양도** — 이 문서 기반으로 추가 설계
- UI 구현은 Phase 8 전후로 별도 이슈
