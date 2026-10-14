
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { neon } from "@neondatabase/serverless";
import type { SajuAccessInput } from "./paymentAccess";

const PENDING_MINUTES = 30;

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  }

  return value;
}

function getSecret() {
  const value = process.env.TOSS_SECRET_KEY;

  if (!value) {
    throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  }

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

  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(),
    iv
  );

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

  return JSON.parse(
    decrypted.toString("utf8")
  ) as SajuAccessInput;
}

function normalizeSaju(saju: SajuAccessInput) {
  return {
    name: String(saju.name || "").trim(),
    birth: String(saju.birth || "").trim(),
    time: String(saju.time || "").trim(),
    gender: String(saju.gender || "").trim(),
    calendar: String(saju.calendar || "").trim(),
  };
}

function sameSaju(
  first: SajuAccessInput,
  second: SajuAccessInput
) {
  const a = normalizeSaju(first);
  const b = normalizeSaju(second);

  return (
    a.name === b.name &&
    a.birth === b.birth &&
    a.time === b.time &&
    a.gender === b.gender &&
    a.calendar === b.calendar
  );
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
  if (!orderId.startsWith("MYEONGUN-")) {
    throw new Error("유효하지 않은 주문번호입니다.");
  }

  const normalized = normalizeSaju(saju);

  if (
    !normalized.name ||
    !normalized.birth ||
    !normalized.time ||
    !normalized.gender ||
    !normalized.calendar
  ) {
    throw new Error("결제에 필요한 사주 정보가 부족합니다.");
  }

  await ensureTable();

  const sql = sqlClient();
  const expiresAt = new Date(
    Date.now() + PENDING_MINUTES * 60 * 1000
  );

  const ciphertext = encryptSaju(normalized);

  // 동일한 주문번호가 이미 존재하면 절대 덮어쓰지 않습니다.
  const inserted = (await sql`
    INSERT INTO myeongun_payment_pending (
      order_id,
      saju_ciphertext,
      expires_at,
      updated_at
    )
    VALUES (
      ${orderId},
      ${ciphertext},
      ${expiresAt.toISOString()},
      NOW()
    )
    ON CONFLICT (order_id) DO NOTHING
    RETURNING expires_at
  `) as Array<{ expires_at: string | Date }>;

  if (inserted.length > 0) {
    return {
      expiresAt: new Date(
        inserted[0].expires_at
      ).toISOString(),
    };
  }

  // 기존 주문번호의 저장 정보를 확인합니다.
  const existing = (await sql`
    SELECT saju_ciphertext, expires_at
    FROM myeongun_payment_pending
    WHERE order_id = ${orderId}
    LIMIT 1
  `) as Array<{
    saju_ciphertext: string;
    expires_at: string | Date;
  }>;

  if (existing.length === 0) {
    throw new Error(
      "주문정보 확인 중 오류가 발생했습니다. 새 주문번호로 다시 시도해주세요."
    );
  }

  const original = decryptSaju(
    existing[0].saju_ciphertext
  );

  if (!sameSaju(original, normalized)) {
    throw new Error(
      "이미 다른 사주 정보로 등록된 주문번호입니다. 새 주문번호로 다시 시도해주세요."
    );
  }

  const originalExpiresAt = new Date(
    existing[0].expires_at
  );

  if (
    !Number.isFinite(originalExpiresAt.getTime()) ||
    originalExpiresAt.getTime() <= Date.now()
  ) {
    throw new Error(
      "결제 준비 시간이 만료되었습니다. 새 주문번호로 다시 시도해주세요."
    );
  }

  // 같은 주문번호와 같은 사주 정보라면
  // 기존 만료일을 그대로 반환합니다.
  return {
    expiresAt: originalExpiresAt.toISOString(),
  };
}

export async function consumePendingPayment(
  orderId: string
) {
  await ensureTable();

  const sql = sqlClient();

  const rows = (await sql`
    SELECT saju_ciphertext
    FROM myeongun_payment_pending
    WHERE order_id = ${orderId}
      AND expires_at > NOW()
    LIMIT 1
  `) as Array<{ saju_ciphertext: string }>;

  return rows[0]
    ? decryptSaju(rows[0].saju_ciphertext)
    : null;
}

export async function deletePendingPayment(
  orderId: string
) {
  await ensureTable();

  const sql = sqlClient();

  await sql`
    DELETE FROM myeongun_payment_pending
    WHERE order_id = ${orderId}
  `;
}
