import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  return neon(process.env.DATABASE_URL);
}

function key() {
  if (!process.env.TOSS_SECRET_KEY) throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  return createHash("sha256")
    .update(`${process.env.TOSS_SECRET_KEY}|myeongun-premium-report-v1`)
    .digest();
}

function encrypt(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(value), "utf8")),
    cipher.final(),
  ]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decrypt(value: string): unknown {
  const parts = value.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) throw new Error("저장된 보고서 형식이 올바르지 않습니다.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(parts[0], "base64url"));
  decipher.setAuthTag(Buffer.from(parts[1], "base64url"));
  return JSON.parse(Buffer.concat([
    decipher.update(Buffer.from(parts[2], "base64url")),
    decipher.final(),
  ]).toString("utf8"));
}

async function ensureTables() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS myeongun_premium_reports (
      order_id TEXT NOT NULL,
      report_key TEXT NOT NULL,
      saju_hash TEXT NOT NULL,
      result_ciphertext TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (order_id, report_key)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS myeongun_premium_report_locks (
      order_id TEXT NOT NULL,
      report_key TEXT NOT NULL,
      claim_id TEXT NOT NULL,
      locked_until TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (order_id, report_key)
    )
  `;
}

export async function getPremiumReport(orderId: string, reportKey: string, sajuHash: string): Promise<unknown | null> {
  await ensureTables();
  const sql = db();
  const rows = await sql`
    SELECT result_ciphertext FROM myeongun_premium_reports
    WHERE order_id = ${orderId} AND report_key = ${reportKey} AND saju_hash = ${sajuHash}
    LIMIT 1
  `;
  return rows.length ? decrypt(String(rows[0].result_ciphertext)) : null;
}

export async function savePremiumReport(orderId: string, reportKey: string, sajuHash: string, result: unknown): Promise<unknown> {
  await ensureTables();
  const sql = db();
  const ciphertext = encrypt(result);
  await sql`
    INSERT INTO myeongun_premium_reports (order_id, report_key, saju_hash, result_ciphertext)
    VALUES (${orderId}, ${reportKey}, ${sajuHash}, ${ciphertext})
    ON CONFLICT (order_id, report_key) DO NOTHING
  `;
  const saved = await getPremiumReport(orderId, reportKey, sajuHash);
  if (saved === null) throw new Error("저장된 보고서를 확인할 수 없습니다.");
  return saved;
}

export async function claimPremiumReport(orderId: string, reportKey: string) {
  await ensureTables();
  const claimId = randomUUID();
  const sql = db();
  const rows = await sql`
    INSERT INTO myeongun_premium_report_locks (order_id, report_key, claim_id, locked_until)
    VALUES (${orderId}, ${reportKey}, ${claimId}, NOW() + INTERVAL '5 minutes')
    ON CONFLICT (order_id, report_key) DO UPDATE
    SET claim_id = EXCLUDED.claim_id, locked_until = EXCLUDED.locked_until
    WHERE myeongun_premium_report_locks.locked_until < NOW()
    RETURNING claim_id
  `;
  return rows.length ? claimId : null;
}

export async function releasePremiumReport(orderId: string, reportKey: string, claimId: string) {
  const sql = db();
  await sql`
    DELETE FROM myeongun_premium_report_locks
    WHERE order_id = ${orderId} AND report_key = ${reportKey} AND claim_id = ${claimId}
  `;
}
