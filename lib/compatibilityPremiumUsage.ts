import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID } from "crypto";
import { hashSaju, type SajuAccessInput } from "./paymentAccess";
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


// 저장 데이터는 주문번호와 이용기간으로 제한하며, 고객의 입력 및 결과는 AES-256-GCM으로 암호화합니다.
function resultKey(): Buffer {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error("암호화 환경 설정이 없습니다.");
  return createHash("sha256").update(`${secret}|myeongun-compatibility-report-v1`).digest();
}

function pairHash(me: SajuAccessInput, partner: SajuAccessInput): string {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error("암호화 환경 설정이 없습니다.");
  return createHmac("sha256", secret)
    .update(JSON.stringify(["compatibility-v1", hashSaju(me), hashSaju(partner)]))
    .digest("hex");
}

function encryptReport(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", resultKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

function decryptReport(value: string): unknown {
  const [iv, tag, data] = value.split(".");
  if (!iv || !tag || !data) throw new Error("저장된 궁합 결과 형식이 올바르지 않습니다.");
  const decipher = createDecipheriv("aes-256-gcm", resultKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8"));
}

async function ensureReportTable() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS myeongun_compatibility_premium_reports (
      order_id TEXT NOT NULL,
      pair_hash TEXT NOT NULL,
      partner_ciphertext TEXT NOT NULL,
      result_ciphertext TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (order_id, pair_hash)
    )
  `;
  // 만료된 결과는 조회되지 않으며, 다음 이용 시 자동 정리합니다.
  await sql`DELETE FROM myeongun_compatibility_premium_reports WHERE expires_at <= NOW()`;
}

type ReportRow = { pair_hash: string; partner_ciphertext: string; result_ciphertext: string; created_at: string | Date };

/** 인증된 주문에 한해서만 호출해야 합니다. */
export async function getSavedCompatibilityReport(orderId: string, me: SajuAccessInput, partner: SajuAccessInput) {
  await ensureReportTable();
  const sql = db();
  const hash = pairHash(me, partner);
  const rows = (await sql`
    SELECT pair_hash, partner_ciphertext, result_ciphertext, created_at
    FROM myeongun_compatibility_premium_reports
    WHERE order_id = ${orderId} AND pair_hash = ${hash} AND expires_at > NOW()
    LIMIT 1
  `) as ReportRow[];
  return rows[0] ? decryptReport(rows[0].result_ciphertext) : null;
}

/** 저장된 상대방 목록. 공개 API에서 사용 시 반드시 이용권과 본인 사주를 검증하세요. */
export async function listSavedCompatibilityReports(orderId: string) {
  await ensureReportTable();
  const sql = db();
  const rows = (await sql`
    SELECT pair_hash, partner_ciphertext, result_ciphertext, created_at
    FROM myeongun_compatibility_premium_reports
    WHERE order_id = ${orderId} AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 3
  `) as ReportRow[];
  return rows.map((row) => {
    const partner = decryptReport(row.partner_ciphertext) as SajuAccessInput;
    return { id: row.pair_hash, partnerName: partner.name || "상대방", partner, createdAt: new Date(row.created_at).toISOString() };
  });
}

/** 목록에서 선택한 저장 결과를 불러옵니다. */
export async function reopenSavedCompatibilityReport(orderId: string, reportId: string) {
  if (!/^[a-f0-9]{64}$/.test(reportId)) return null;
  await ensureReportTable();
  const sql = db();
  const rows = (await sql`
    SELECT pair_hash, partner_ciphertext, result_ciphertext, created_at
    FROM myeongun_compatibility_premium_reports
    WHERE order_id = ${orderId} AND pair_hash = ${reportId} AND expires_at > NOW()
    LIMIT 1
  `) as ReportRow[];
  if (!rows[0]) return null;
  return { result: decryptReport(rows[0].result_ciphertext), partner: decryptReport(rows[0].partner_ciphertext) as SajuAccessInput };
}

/**
 * 저장과 횟수 차감은 하나의 SQL 문장으로 처리합니다.
 * 저장이 실패하거나 이미 저장된 두 사람이라면 사용 횟수를 추가 차감하지 않습니다.
 */
export async function saveAndCompleteCompatibilityUsage(
  orderId: string,
  claimId: string,
  expiresAtUnix: number,
  me: SajuAccessInput,
  partner: SajuAccessInput,
  result: unknown
): Promise<boolean> {
  await ensureReportTable();
  const sql = db();
  const hash = pairHash(me, partner);
  const encryptedPartner = encryptReport(partner);
  const encryptedResult = encryptReport(result);
  const expiresAt = expiryDate(expiresAtUnix);
  const rows = await sql`
    WITH inserted AS (
      INSERT INTO myeongun_compatibility_premium_reports
        (order_id, pair_hash, partner_ciphertext, result_ciphertext, expires_at)
      SELECT ${orderId}, ${hash}, ${encryptedPartner}, ${encryptedResult},
             LEAST(u.expires_at, ${expiresAt}::timestamptz)
      FROM myeongun_compatibility_premium_usage u
      WHERE u.order_id = ${orderId} AND u.claim_id = ${claimId}
        AND u.claimed_until > NOW() AND u.expires_at > NOW()
        AND u.used_count < ${MAX_USES}
      ON CONFLICT (order_id, pair_hash) DO NOTHING
      RETURNING order_id
    ), completed AS (
      UPDATE myeongun_compatibility_premium_usage u
      SET used_count = u.used_count + 1, claim_id = NULL,
          claimed_until = NULL, updated_at = NOW()
      WHERE u.order_id = ${orderId} AND u.claim_id = ${claimId}
        AND u.claimed_until > NOW() AND u.expires_at > NOW()
        AND u.used_count < ${MAX_USES}
        AND EXISTS (SELECT 1 FROM inserted)
      RETURNING u.order_id
    )
    SELECT order_id FROM completed
  `;
  return rows.length === 1;
}
