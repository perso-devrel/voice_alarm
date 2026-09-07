/**
 * 사용 기록 수집 — 앱이 쌓아 둔 이벤트를 **모아서** 보낸다.
 *
 * 왜 배치인가: 앱은 오프라인에서도 알람을 만들고 울린다. 그동안의 사건은 기기에 쌓였다가
 * 연결될 때 한꺼번에 올라온다 — 요청마다 한 건씩 보내면 재연결 순간에 수십 번을 왕복한다.
 *
 * ⚠ **울릴 때 이 API 를 부르지 않는다.** 알람 경로는 로컬·오프라인이 원칙이라(CLAUDE.md
 * 「Real alarm」) 울림은 기기에 적기만 하고, 전송은 그 뒤 아무 때나 한다.
 */
import { Hono } from 'hono';
import { UsageEventBatchSchema, type UsageEvent } from '@alarmtalk/shared';
import type { AppEnv } from '../types';
import { getDB } from '../lib/db';
import { jsonError } from '../lib/api-error';
import { withWriteTransaction } from '../lib/transactions';

const events = new Hono<AppEnv>();

/** 한 번의 INSERT 에 묶을 이벤트 수. Workers 의 요청당 서브리퀘스트 상한을 고려한 값이다. */
const INSERT_CHUNK = 25;

/**
 * 이벤트 배치 수집.
 *
 * 멱등: `id` 는 클라가 만든 UUID 이고 PK 라, 같은 배치를 다시 보내면
 * `INSERT OR IGNORE` 가 조용히 무시한다. 그래서 앱은 **응답을 못 받은 배치**를 마음 놓고
 * 재전송할 수 있다(그게 오프라인 큐의 정상 동작이다).
 */
events.post('/', async (c) => {
  const userPk = c.get('userIdPK') || c.get('userId');
  const db = getDB(c.env);

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return jsonError(c, 400, 'INVALID_JSON', 'Invalid JSON body');
  }

  const parsed = UsageEventBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(
      c,
      400,
      'INVALID_USAGE_EVENTS',
      parsed.error.issues[0]?.message ?? 'Invalid events payload',
    );
  }

  // ⚠ **`occurred_at` 은 기기 시계다 — 미래로 가 있을 수 있다.** 그대로 두면 두 가지가
  // 깨진다: 보관 1년 정리(`index.ts` 의 `occurred_at < cutoff`)를 영원히 빠져나가고,
  // 아래 `in_use_updated_at` 비교가 미래 값에 고정돼 **이후의 정당한 기록이 전부 무시된다.**
  // 거부하지 않고 **다듬는다** — 앱은 2xx 가 아니면 큐를 지우지 않고 계속 재전송하므로
  // 400 은 그 기기의 큐를 영구히 막는다(CLAUDE.md 「거부와 다듬기를 구분한다」).
  // 늦게 도착한 **과거** 값은 그대로 둔다 — 그게 실제로 일어난 시각이다.
  const receivedAtMs = Date.now();
  const boundOccurredAt = (value: string): string => {
    const ms = Date.parse(value);
    // 파싱 불가는 스키마가 이미 막지만, 뚫리면 도착 시각으로 굳힌다.
    if (Number.isNaN(ms)) return new Date(receivedAtMs).toISOString();
    // toISOString 이 오프셋 표기(+09:00)까지 UTC 로 굳혀, 문자열로 비교하는 정리 쿼리와 맞춘다.
    return new Date(Math.min(ms, receivedAtMs)).toISOString();
  };
  const list: UsageEvent[] = parsed.data.events.map((event: UsageEvent) => ({
    ...event,
    occurred_at: boundOccurredAt(event.occurred_at),
  }));
  await withWriteTransaction(db, async (tx) => {
    for (let i = 0; i < list.length; i += INSERT_CHUNK) {
      const chunk = list.slice(i, i + INSERT_CHUNK);
      const values = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      await tx.execute({
        sql: `INSERT OR IGNORE INTO usage_events
                (id, user_id, type, occurred_at, alarm_id, voice_profile_id, message_id, detail)
              VALUES ${values}`,
        args: chunk.flatMap((event: UsageEvent) => [
          event.id,
          userPk,
          event.type,
          event.occurred_at,
          event.alarm_id ?? null,
          event.voice_profile_id ?? null,
          event.message_id ?? null,
          event.detail ?? null,
        ]),
      });
    }

    // 문구의 '사용중/비사용중' 은 **폰이 판정한 사실**이다(그 오디오를 쓰는 알람이 폰에
    // 남아 있는가). 서버는 받아 적을 뿐이다 — 여기서 추측하면 기기마다 다른 사실을
    // 서로 덮어쓴다.
    //
    // ⚠ **본인 보관함 행만 건드린다**(IDOR). `message_id` 는 클라가 준 값이라 소유권을
    // 조건으로 걸어야 한다 — 남의 문구를 비사용중으로 만들 수 있으면 그 오디오가
    // 정리 대상이 된다.
    for (const event of list) {
      if (!event.message_id) continue;
      // ⚠ **남기는 것은 도착 순서가 아니라 더 최근 사실이다 — 붙임·해제 양쪽 다.**
      //   오프라인 큐는 며칠 밀릴 수 있고, 같은 문구(=같은 `message_id`)를 두 기기가
      //   함께 쓸 수 있다(캐시 히트가 같은 id 를 돌려준다). 그래서 두 갈래 모두
      //   `in_use_updated_at` 을 비교해 **더 최근 사실만** 남긴다 — 한쪽만 막으면
      //   뒤늦게 도착한 '붙임' 이 최신 '해제' 를 되돌린다.
      if (event.type === 'manual_message_attached') {
        await tx.execute({
          sql: `UPDATE message_library
                   SET in_use = 1, in_use_updated_at = ?, last_used_at = ?
                 WHERE message_id = ? AND user_id = ?
                   AND (in_use_updated_at IS NULL OR in_use_updated_at <= ?)`,
          args: [
            event.occurred_at,
            event.occurred_at,
            event.message_id,
            userPk,
            event.occurred_at,
          ],
        });
      } else if (event.type === 'manual_message_released') {
        await tx.execute({
          sql: `UPDATE message_library
                   SET in_use = 0, in_use_updated_at = ?
                 WHERE message_id = ? AND user_id = ?
                   AND (in_use_updated_at IS NULL OR in_use_updated_at <= ?)`,
          args: [event.occurred_at, event.message_id, userPk, event.occurred_at],
        });
      }
    }
  });

  return c.json({ accepted: list.length });
});

export default events;
