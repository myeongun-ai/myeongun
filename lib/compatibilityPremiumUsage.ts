import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

const MAX_USES = 3;
const LOCK_MINUTES = 10;

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  return neon(url);
}

async function ensureTable() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS myeongun_compatibility_premium_usage (
      order_id TEXT PRIMARY KEY,
      used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count BETWEEN 0 AND 3),
      claim_id TEXT,
      claimed_until TIMESTAMPTZ,
      expires_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function expiryDate(expiresAtUnix: number) {
  if (!Number.isSafeInteger(expiresAtUnix) || expiresAtUnix <= 0) {
    throw new Error("이용권 만료일이 올바르지 않습니다.");
  }
  return new Date(expiresAtUnix * 1000).toISOString();
}

export type CompatibilityUsageStatus = {
  used: number;
  remaining: number;
  busy: boolean;
};

/**
 * 반드시 호출 API에서 서명된 이용권, 결제자 사주 해시를 먼저 검증하세요.
 * orderId와 expiresAtUnix를 브라우저 입력값에서 직접 받으면 안 됩니다.
 */
export async function getCompatibilityUsage(
  orderId: string,
  expiresAtUnix: number
): Promise<CompatibilityUsageStatus> {
  await ensureTable();
  const sql = db();
  const expiresAt = expiryDate(expiresAtUnix);
  const rows = await sql`
    INSERT INTO myeongun_compatibility_premium_usage (order_id, expires_at)
    VALUES (${orderId}, ${expiresAt}::timestamptz)
    ON CONFLICT (order_id) DO UPDATE
      SET expires_at = LEAST(myeongun_compatibility_premium_usage.expires_at, EXCLUDED.expires_at)
    RETURNING used_count, claim_id, claimed_until, expires_at
  `;
  const row = rows[0];
  const used = Number(row.used_count);
  const active = new Date(String(row.expires_at)).getTime() > Date.now();
  return {
    used,
    remaining: active ? Math.max(0, MAX_USES - used) : 0,
    busy: active && Boolean(row.claim_id && row.claimed_until && new Date(String(row.claimed_until)).getTime() > Date.now()),
  };
}

/** 성공 시 claimId를 반환합니다. 사용 가능 횟수가 없거나 다른 분석 중이면 null. */
export async function claimCompatibilityUsage(
  orderId: string,
  expiresAtUnix: number
): Promise<string | null> {
  await ensureTable();
  const sql = db();
  const expiresAt = expiryDate(expiresAtUnix);
  const claimId = randomUUID();
  const rows = await sql`
    INSERT INTO myeongun_compatibility_premium_usage
      (order_id, expires_at, claim_id, claimed_until)
    SELECT ${orderId}, ${expiresAt}::timestamptz,
           ${claimId}, NOW() + (${LOCK_MINUTES} * INTERVAL '1 minute')
    WHERE ${expiresAt}::timestamptz > NOW()
    ON CONFLICT (order_id) DO UPDATE
      SET claim_id = EXCLUDED.claim_id,
          claimed_until = EXCLUDED.claimed_until,
          expires_at = LEAST(myeongun_compatibility_premium_usage.expires_at, EXCLUDED.expires_at),
          updated_at = NOW()
    WHERE myeongun_compatibility_premium_usage.used_count < ${MAX_USES}
      AND myeongun_compatibility_premium_usage.expires_at > NOW()
      AND (myeongun_compatibility_premium_usage.claim_id IS NULL
           OR myeongun_compatibility_premium_usage.claimed_until <= NOW())
    RETURNING claim_id
  `;
  return rows.length ? claimId : null;
}

/**
 * 분석 결과가 성공적으로 생성된 뒤 호출하세요.
 * claimId가 일치하는 경우에만 1회 차감하며, 중복 호출은 차감하지 않습니다.
 * false면 결과를 고객에게 성공으로 전달하지 마세요.
 */
export async function completeCompatibilityUsage(
  orderId: string,
  claimId: string
): Promise<boolean> {
  const sql = db();
  const rows = await sql`
    UPDATE myeongun_compatibility_premium_usage
    SET used_count = used_count + 1,
        claim_id = NULL,
        claimed_until = NULL,
        updated_at = NOW()
    WHERE order_id = ${orderId}
      AND claim_id = ${claimId}
      AND used_count < ${MAX_USES}
      AND expires_at > NOW()
      AND claimed_until > NOW()
    RETURNING used_count
  `;
  return rows.length === 1;
}

/** 실패 시 예약만 해제합니다. 사용 횟수는 차감되지 않습니다. */
export async function releaseCompatibilityUsage(
  orderId: string,
  claimId: string
): Promise<void> {
  const sql = db();
  await sql`
    UPDATE myeongun_compatibility_premium_usage
    SET claim_id = NULL,
        claimed_until = NULL,
        updated_at = NOW()
    WHERE order_id = ${orderId} AND claim_id = ${claimId}
  `;
}
