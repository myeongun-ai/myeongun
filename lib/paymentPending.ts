import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";
import { SajuAccessInput } from "./paymentAccess";

const PENDING_MINUTES = 30;

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  return value;
}

function getSecret() {
  const value = process.env.TOSS_SECRET_KEY;
  if (!value) throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  return value;
}

function sqlClient() {
  return neon(getDatabaseUrl());
}

function encryptionKey() {
  return createHash("sha256")
    .update(`${getSecret()}|myeongun-payment-pending-v1`)
    .digest();
}

function encryptSaju(saju: SajuAccessInput) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(saju), "utf8")),
    cipher.final(),
  ]);

  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptSaju(value: string): SajuAccessInput {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("임시 결제정보 형식이 올바르지 않습니다.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8")) as SajuAccessInput;
}

async function ensureTable() {
  const sql = sqlClient();

  await sql`
    CREATE TABLE IF NOT EXISTS myeongun_payment_pending (
      order_id TEXT PRIMARY KEY,
      saju_ciphertext TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_myeongun_payment_pending_expires_at
    ON myeongun_payment_pending (expires_at)
  `;
}

export async function savePendingPayment(
  orderId: string,
  saju: SajuAccessInput
) {
  await ensureTable();

  const sql = sqlClient();
  const expiresAt = new Date(Date.now() + PENDING_MINUTES * 60 * 1000);
  const ciphertext = encryptSaju(saju);

  await sql`DELETE FROM myeongun_payment_pending WHERE expires_at <= NOW()`;

  await sql`
    INSERT INTO myeongun_payment_pending (
      order_id, saju_ciphertext, expires_at, updated_at
    )
    VALUES (
      ${orderId}, ${ciphertext}, ${expiresAt.toISOString()}, NOW()
    )
    ON CONFLICT (order_id)
    DO UPDATE SET
      saju_ciphertext = EXCLUDED.saju_ciphertext,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `;

  return { expiresAt: expiresAt.toISOString() };
}

export async function consumePendingPayment(orderId: string) {
  await ensureTable();
  const sql = sqlClient();

  const rows = (await sql`
    SELECT saju_ciphertext
    FROM myeongun_payment_pending
    WHERE order_id = ${orderId}
      AND expires_at > NOW()
    LIMIT 1
  `) as Array<{ saju_ciphertext: string }>;

  return rows[0] ? decryptSaju(rows[0].saju_ciphertext) : null;
}

export async function deletePendingPayment(orderId: string) {
  await ensureTable();
  const sql = sqlClient();
  await sql`DELETE FROM myeongun_payment_pending WHERE order_id = ${orderId}`;
}