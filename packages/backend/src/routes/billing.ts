import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/db';
import { generateVoucherCode } from '../lib/vouchers';

const billing = new Hono<AppEnv>();

const PAID_PLAN_TYPES = new Set(['personal', 'family']);

function planTypeToUserPlan(planType: string): 'free' | 'plus' | 'family' {
  if (planType === 'family') return 'family';
  if (planType === 'personal') return 'plus';
  return 'free';
}

/**
 * POST /billing/checkout — 스텁 결제 엔드포인트.
 * TODO: integrate real PG (TossPayments / Iamport) — currently stub 이며 결제 성공 여부를 항상 true 로 가정한다.
 */
billing.post('/checkout', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const body = await c.req
    .json<{ plan_key?: unknown }>()
    .catch(() => ({ plan_key: undefined }));

  const planKey = typeof body.plan_key === 'string' ? body.plan_key.trim() : '';
  if (!planKey) {
    return c.json({ error: 'plan_key 는 필수입니다' }, 400);
  }

  const planRes = await db.execute({
    sql: `SELECT id, key, name, plan_type, period_days, max_members, price_krw, is_active
          FROM plans WHERE key = ?`,
    args: [planKey],
  });
  if (planRes.rows.length === 0) {
    return c.json({ error: '존재하지 않는 플랜입니다' }, 400);
  }
  const plan = planRes.rows[0];
  if (Number(plan.is_active) !== 1) {
    return c.json({ error: '비활성화된 플랜입니다' }, 400);
  }
  const planType = String(plan.plan_type);
  if (!PAID_PLAN_TYPES.has(planType)) {
    return c.json({ error: 'free 는 기본 플랜이라 결제 대상이 아닙니다' }, 400);
  }

  const userRes = await db.execute({
    sql: 'SELECT id FROM users WHERE google_id = ?',
    args: [userId],
  });
  if (userRes.rows.length === 0) {
    return c.json({ error: '사용자를 찾을 수 없습니다' }, 404);
  }
  const userPk = String(userRes.rows[0].id);

  const subscriptionId = crypto.randomUUID();
  const periodDays = Number(plan.period_days) || 30;
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + periodDays * 24 * 60 * 60 * 1000);

  await db.execute({
    sql: `INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, expires_at)
          VALUES (?, ?, ?, 'active', ?, ?)`,
    args: [
      subscriptionId,
      userPk,
      String(plan.id),
      startsAt.toISOString(),
      expiresAt.toISOString(),
    ],
  });

  const mirroredPlan = planTypeToUserPlan(planType);
  await db.execute({
    sql: `UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [mirroredPlan, userPk],
  });

  // 1회용 이용권 코드 자동 발급 (#28)
  const voucherId = crypto.randomUUID();
  const { code: voucherCode, hash: voucherHash } = await generateVoucherCode();
  await db.execute({
    sql: `INSERT INTO voucher_codes
          (id, code, code_hash, plan_id, issuer_user_id, issuer_subscription_id, status, issued_at, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, 'issued', ?, ?)`,
    args: [
      voucherId,
      voucherCode,
      voucherHash,
      String(plan.id),
      userPk,
      subscriptionId,
      startsAt.toISOString(),
      expiresAt.toISOString(),
    ],
  });

  return c.json({
    success: true,
    checkout_stub: true,
    subscription: {
      id: subscriptionId,
      user_id: userPk,
      plan_id: String(plan.id),
      status: 'active',
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    plan: {
      id: String(plan.id),
      key: String(plan.key),
      name: String(plan.name),
      plan_type: planType,
      period_days: periodDays,
      max_members: Number(plan.max_members),
      price_krw: Number(plan.price_krw),
    },
    voucher: {
      id: voucherId,
      code: voucherCode,
      expires_at: expiresAt.toISOString(),
    },
  });
});

/** GET /billing/vouchers — 내가 발급한 이용권 코드 목록 (발급자에게만 평문 노출) */
billing.get('/vouchers', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const userRes = await db.execute({
    sql: 'SELECT id FROM users WHERE google_id = ?',
    args: [userId],
  });
  if (userRes.rows.length === 0) {
    return c.json({ vouchers: [] });
  }
  const userPk = String(userRes.rows[0].id);

  const result = await db.execute({
    sql: `SELECT v.id, v.code, v.plan_id, v.issuer_subscription_id, v.redeemed_by_user_id,
                 v.status, v.issued_at, v.used_at, v.expires_at,
                 p.key AS plan_key, p.name AS plan_name, p.plan_type
          FROM voucher_codes v
          JOIN plans p ON p.id = v.plan_id
          WHERE v.issuer_user_id = ?
          ORDER BY v.issued_at DESC`,
    args: [userPk],
  });

  return c.json({
    vouchers: result.rows.map((r) => ({
      id: String(r.id),
      code: String(r.code),
      plan_id: String(r.plan_id),
      plan_key: String(r.plan_key),
      plan_name: String(r.plan_name),
      plan_type: String(r.plan_type),
      subscription_id: (r.issuer_subscription_id as string | null) ?? null,
      redeemed_by_user_id: (r.redeemed_by_user_id as string | null) ?? null,
      status: String(r.status),
      issued_at: String(r.issued_at),
      used_at: (r.used_at as string | null) ?? null,
      expires_at: String(r.expires_at),
    })),
  });
});

/** GET /billing/subscription — 현재 사용자 활성 구독(+plan JOIN) 반환 */
billing.get('/subscription', async (c) => {
  const userId = c.get('userId');
  const db = getDB(c.env);

  const result = await db.execute({
    sql: `SELECT s.id AS sub_id, s.user_id, s.plan_id, s.plan_group_id,
                 s.status, s.starts_at, s.expires_at,
                 p.key AS plan_key, p.name AS plan_name, p.plan_type,
                 p.period_days, p.max_members, p.price_krw
          FROM subscriptions s
          JOIN users u ON u.id = s.user_id
          JOIN plans p ON p.id = s.plan_id
          WHERE u.google_id = ?
            AND s.status = 'active'
            AND s.expires_at > datetime('now')
          ORDER BY s.starts_at DESC
          LIMIT 1`,
    args: [userId],
  });

  if (result.rows.length === 0) {
    return c.json({ subscription: null, plan: null });
  }

  const r = result.rows[0];
  return c.json({
    subscription: {
      id: String(r.sub_id),
      user_id: String(r.user_id),
      plan_id: String(r.plan_id),
      plan_group_id: (r.plan_group_id as string | null) ?? null,
      status: String(r.status),
      starts_at: String(r.starts_at),
      expires_at: String(r.expires_at),
    },
    plan: {
      id: String(r.plan_id),
      key: String(r.plan_key),
      name: String(r.plan_name),
      plan_type: String(r.plan_type),
      period_days: Number(r.period_days),
      max_members: Number(r.max_members),
      price_krw: Number(r.price_krw),
    },
  });
});

export default billing;
