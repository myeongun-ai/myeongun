import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import { neon } from "@neondatabase/serverless";
import {
  hashReopen,
  SajuAccessInput,
} from "./paymentAccess";
import { calculateMyeongunManseryeok } from "./manseryeok";

const REOPEN_DAYS = 7;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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
    .update(`${getSecret()}|myeongun-reopen-encryption-v1`)
    .digest();
}

function codeHash(code: string) {
  return createHmac("sha256", getSecret())
    .update(`myeongun-reopen-code-v1|${normalizeCode(code)}`)
    .digest("hex");
}

function normalizeCode(code: string) {
  return String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

function generateCode(length = 8) {
  const bytes = randomBytes(length);
  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }

  return code;
}

function encryptSaju(saju: SajuAccessInput) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(saju), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptSaju(value: string): SajuAccessInput {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("저장된 사주정보 형식이 올바르지 않습니다.");
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

function isSameActualBirthDate(stored: SajuAccessInput, inputBirth: string) {
  if (!stored.birth) return false;
  try {
    const storedResult = calculateMyeongunManseryeok({
      birth: stored.birth,
      time: stored.time,
      calendar: stored.calendar,
    });

    const storedSolar = `${storedResult.solar.year}-${String(storedResult.solar.month).padStart(2, "0")}-${String(storedResult.solar.day).padStart(2, "0")}`;

    const calendars = ["양력", "음력(평달)", "음력(윤달)"] as const;

    return calendars.some((calendar) => {
      try {
        const candidate = calculateMyeongunManseryeok({
          birth: inputBirth,
          calendar,
        });

        const candidateSolar = `${candidate.solar.year}-${String(candidate.solar.month).padStart(2, "0")}-${String(candidate.solar.day).padStart(2, "0")}`;

        return candidateSolar === storedSolar;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
async function ensureTable() {
  const sql = sqlClient();

  await sql`
    CREATE TABLE IF NOT EXISTS myeongun_reopen_access (
      order_id TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL UNIQUE,
      reopen_hash TEXT NOT NULL,
      saju_ciphertext TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_myeongun_reopen_access_expires_at
    ON myeongun_reopen_access (expires_at)
  `;
}

export async function saveCrossDeviceReopen(
  orderId: string,
  saju: SajuAccessInput
) {
  await ensureTable();

  const code = generateCode(8);
  const hashedCode = codeHash(code);
  const reopenHash = hashReopen(saju);
  const ciphertext = encryptSaju(saju);
  const expiresAt = new Date(
    Date.now() + REOPEN_DAYS * 24 * 60 * 60 * 1000
  );
  const sql = sqlClient();

  await sql`
    INSERT INTO myeongun_reopen_access (
      order_id,
      code_hash,
      reopen_hash,
      saju_ciphertext,
      expires_at,
      updated_at
    )
    VALUES (
      ${orderId},
      ${hashedCode},
      ${reopenHash},
      ${ciphertext},
      ${expiresAt.toISOString()},
      NOW()
    )
    ON CONFLICT (order_id)
    DO UPDATE SET
      code_hash = EXCLUDED.code_hash,
      reopen_hash = EXCLUDED.reopen_hash,
      saju_ciphertext = EXCLUDED.saju_ciphertext,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `;

  return {
    code,
    expiresAt: expiresAt.toISOString(),
    reopenDays: REOPEN_DAYS,
  };
}

export async function redeemCrossDeviceReopen(input: {
  name: string;
  birth: string;
  code: string;
}) {
  await ensureTable();

  const normalizedCode = normalizeCode(input.code);
  if (normalizedCode.length !== 8) {
    return null;
  }

  const sql = sqlClient();
  const rows = (await sql`
    SELECT order_id, reopen_hash, saju_ciphertext, expires_at
    FROM myeongun_reopen_access
    WHERE code_hash = ${codeHash(normalizedCode)}
      AND expires_at > NOW()
    LIMIT 1
  `) as Array<{
    order_id: string;
    reopen_hash: string;
    saju_ciphertext: string;
    expires_at: string | Date;
  }>;

  const row = rows[0];
  if (!row) return null;

  const expected = Buffer.from(row.reopen_hash);
  const received = Buffer.from(
    hashReopen({ name: input.name, birth: input.birth })
  );

  const exactMatch =
    expected.length === received.length &&
    timingSafeEqual(expected, received);

  const saju = decryptSaju(row.saju_ciphertext);

  if (!exactMatch) {
    const sameName =
      String(saju.name || "").trim() === String(input.name || "").trim();

    if (!sameName || !isSameActualBirthDate(saju, input.birth)) {
      return null;
    }
  }

  return {
    orderId: row.order_id,
    saju,
    expiresAt:
      row.expires_at instanceof Date
        ? row.expires_at.toISOString()
        : String(row.expires_at),
  };
}
