
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { neon } from "@neondatabase/serverless";

const TABLE_NAME = "myeongun_premium_results";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  }

  return url;
}

function getSecret() {
  const secret = process.env.TOSS_SECRET_KEY;

  if (!secret) {
    throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  }

  return secret;
}

function sqlClient() {
  return neon(getDatabaseUrl());
}

function encryptionKey() {
  return createHash("sha256")
    .update(`${getSecret()}|myeongun-premium-result-v1`)
    .digest();
}

function encryptResult(result: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(),
    iv
  );

  const plaintext = Buffer.from(
    JSON.stringify(result),
    "utf8"
  );

  const encrypted = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptResult(value: string): unknown {
  const [ivPart, tagPart, encryptedPart] = value.split(".");

  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("저장된 상세 분석 형식이 올바르지 않습니다.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url")
  );

  decipher.setAuthTag(
    Buffer.from(tagPart, "base64url")
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encryptedPart, "base64url")
    ),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

async function ensureTable() {
  const sql = sqlClient();

  await sql`
    CREATE TABLE IF NOT EXISTS myeongun_premium_results (
      order_id TEXT PRIMARY KEY,
      saju_hash TEXT NOT NULL,
      result_ciphertext TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function getPremiumResult(
  orderId: string,
  sajuHash: string
): Promise<unknown | null> {
  await ensureTable();

  const sql = sqlClient();

  const rows = await sql`
    SELECT result_ciphertext
    FROM myeongun_premium_results
    WHERE order_id = ${orderId}
      AND saju_hash = ${sajuHash}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  return decryptResult(
    String(rows[0].result_ciphertext)
  );
}

export async function savePremiumResult(
  orderId: string,
  sajuHash: string,
  result: unknown
): Promise<unknown> {
  await ensureTable();

  const sql = sqlClient();
  const ciphertext = encryptResult(result);

  await sql`
    INSERT INTO myeongun_premium_results (
      order_id,
      saju_hash,
      result_ciphertext
    )
    VALUES (
      ${orderId},
      ${sajuHash},
      ${ciphertext}
    )
    ON CONFLICT (order_id) DO NOTHING
  `;

  const saved = await getPremiumResult(
    orderId,
    sajuHash
  );

  if (saved === null) {
    throw new Error(
      "상세 분석 저장 결과를 확인할 수 없습니다."
    );
  }

  return saved;
}
