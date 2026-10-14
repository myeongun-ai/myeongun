import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomInt,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import { neon } from "@neondatabase/serverless";
import { hashReopen } from "./paymentAccess";
import type { SajuAccessInput } from "./paymentAccess";
import { calculateMyeongunManseryeok } from "./manseryeok";

const REOPEN_DAYS = 7;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  return url;
}

function getSecret() {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
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

function codeEncryptionKey() {
  return createHash("sha256")
    .update(`${getSecret()}|myeongun-reopen-code-encryption-v1`)
    .digest();
}

function normalizeCode(code: string) {
  return String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

function codeHash(code: string) {
  return createHmac("sha256", getSecret())
    .update(`myeongun-reopen-code-v1|${normalizeCode(code)}`)
    .digest("hex");
}

function generateCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function encryptValue(value: string, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(value, "utf8")),
    cipher.final(),
  ]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptValue(value: string, key: Buffer) {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("암호화된 정보 형식이 올바르지 않습니다.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function encryptSaju(saju: SajuAccessInput) {
  return encryptValue(JSON.stringify(saju), encryptionKey());
}

function decryptSaju(value: string): SajuAccessInput {
  return JSON.parse(decryptValue(value, encryptionKey())) as SajuAccessInput;
}

function encryptCode(code: string) {
  return encryptValue(code, codeEncryptionKey());
}

function decryptCode(value: string) {
  return decryptValue(value, codeEncryptionKey());
}

function isSameActualBirthDate(
  stored: SajuAccessInput,
  inputBirth: string,
  inputCalendar?: string
) {
  if (!stored.birth) return false;
  try {
    const storedResult = calculateMyeongunManseryeok({
      birth: stored.birth,
      time: stored.time,
      calendar: stored.calendar,
    });
    const storedSolar =
      `${storedResult.solar.year}-` +
      `${String(storedResult.solar.month).padStart(2, "0")}-` +
      `${String(storedResult.solar.day).padStart(2, "0")}`;
    const calendars = inputCalendar
      ? [String(inputCalendar).trim()]
      : ["양력", "음력(평달)", "음력(윤달)"];
    return calendars.some((calendar) => {
      try {
        const candidate = calculateMyeongunManseryeok({
          birth: inputBirth,
          calendar,
        });
        const candidateSolar =
          `${candidate.solar.year}-` +
          `${String(candidate.solar.month).padStart(2, "0")}-` +
          `${String(candidate.solar.day).padStart(2, "0")}`;
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
    ALTER TABLE myeongun_reopen_access
    ADD COLUMN IF NOT EXISTS code_ciphertext TEXT
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_myeongun_reopen_access_expires_at
    ON myeongun_reopen_access (expires_at)
  `;
}

type ReopenRow = {
  order_id: string;
  code_hash: string;
  reopen_hash: string;
  saju_ciphertext: string;
  code_ciphertext: string | null;
  expires_at: string | Date;
};

function toISOString(value: string | Date) {
  return new Date(value).toISOString();
}

function sameSaju(first: SajuAccessInput, second: SajuAccessInput) {
  return (
    String(first.name || "").trim() === String(second.name || "").trim() &&
    String(first.birth || "").trim() === String(second.birth || "").trim() &&
    String(first.time || "").trim() === String(second.time || "").trim() &&
    String(first.gender || "").trim() === String(second.gender || "").trim() &&
    String(first.calendar || "").trim() === String(second.calendar || "").trim()
  );
}

function verifiedStoredCode(row: ReopenRow): string | null {
  if (!row.code_ciphertext) return null;
  const code = decryptCode(row.code_ciphertext);
  const normalized = normalizeCode(code);
  const expected = Buffer.from(row.code_hash, "hex");
  const received = Buffer.from(codeHash(code), "hex");
  if (
    normalized.length !== 8 ||
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new Error("저장된 이용코드 검증에 실패했습니다.");
  }
  return code;
}

/**
 * 서버 내부용 조회 함수입니다.
 * 이 함수는 주문번호의 소유권을 확인하지 않습니다.
 * 호출 API는 결제 상태와 이용권/요청자 권한을 먼저 검증해야 합니다.
 * 주문번호만 입력받는 공개 API에 직접 연결하지 마세요.
 */
export async function getExistingReopenForVerifiedPayment(orderId: string) {
  if (
    !/^MYEONGUN-[A-Za-z0-9_-]+$/.test(orderId) ||
    orderId.length > 100
  ) {
    return null;
  }
  await ensureTable();
  const sql = sqlClient();
  const rows = (await sql`
    SELECT
      order_id,
      code_hash,
      reopen_hash,
      saju_ciphertext,
      code_ciphertext,
      expires_at
    FROM myeongun_reopen_access
    WHERE order_id = ${orderId}
      AND expires_at > NOW()
    LIMIT 1
  `) as ReopenRow[];
  const row = rows[0];
  if (!row) return null;
  return {
    orderId: row.order_id,
    saju: decryptSaju(row.saju_ciphertext),
    code: verifiedStoredCode(row),
    expiresAt: toISOString(row.expires_at),
    reopenDays: REOPEN_DAYS,
  };
}

/**
 * 최초 승인 시 이용코드를 발급합니다.
 * 동일 주문 재요청 시 기존 코드를 유지하고 반환합니다.
 * 기존 해시 전용 기록은 원문 복구가 불가능합니다.
 */
export async function saveCrossDeviceReopen(
  orderId: string,
  saju: SajuAccessInput
) {
  await ensureTable();
  const code = generateCode(8);
  const hashedCode = codeHash(code);
  const encryptedCode = encryptCode(code);
  const reopenHash = hashReopen(saju);
  const ciphertext = encryptSaju(saju);
  const expiresAt = new Date(
    Date.now() + REOPEN_DAYS * 24 * 60 * 60 * 1000
  );
  const sql = sqlClient();
  const inserted = (await sql`
    INSERT INTO myeongun_reopen_access (
      order_id,
      code_hash,
      code_ciphertext,
      reopen_hash,
      saju_ciphertext,
      expires_at,
      updated_at
    )
    VALUES (
      ${orderId},
      ${hashedCode},
      ${encryptedCode},
      ${reopenHash},
      ${ciphertext},
      ${expiresAt.toISOString()},
      NOW()
    )
    ON CONFLICT (order_id) DO NOTHING
    RETURNING order_id, expires_at
  `) as Array<{ order_id: string; expires_at: string | Date }>;
  if (inserted.length > 0) {
    return {
      code,
      expiresAt: toISOString(inserted[0].expires_at),
      reopenDays: REOPEN_DAYS,
      alreadyIssued: false,
    };
  }
  const existing = (await sql`
    SELECT
      order_id,
      code_hash,
      reopen_hash,
      saju_ciphertext,
      code_ciphertext,
      expires_at
    FROM myeongun_reopen_access
    WHERE order_id = ${orderId}
    LIMIT 1
  `) as ReopenRow[];
  const row = existing[0];
  if (!row) throw new Error("기존 결제 이용코드를 확인할 수 없습니다.");
  const storedSaju = decryptSaju(row.saju_ciphertext);
  if (!sameSaju(storedSaju, saju)) {
    throw new Error("동일 주문번호에 다른 사주 정보가 저장되어 있습니다.");
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    throw new Error("기존 결제 이용기간이 만료되었습니다.");
  }
  return {
    code: verifiedStoredCode(row),
    expiresAt: toISOString(row.expires_at),
    reopenDays: REOPEN_DAYS,
    alreadyIssued: true,
  };
}

export async function redeemCrossDeviceReopen(input: {
  name: string;
  birth: string;
  code: string;
  calendar?: string;
}) {
  await ensureTable();
  const normalizedCode = normalizeCode(input.code);
  if (normalizedCode.length !== 8) return null;
  const sql = sqlClient();
  const rows = (await sql`
    SELECT
      order_id,
      code_hash,
      reopen_hash,
      saju_ciphertext,
      code_ciphertext,
      expires_at
    FROM myeongun_reopen_access
    WHERE code_hash = ${codeHash(normalizedCode)}
      AND expires_at > NOW()
    LIMIT 1
  `) as ReopenRow[];
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
  const sameName =
    String(saju.name || "").trim() ===
    String(input.name || "").trim();
  if (!exactMatch) {
    const sameActualBirthDate = isSameActualBirthDate(
      saju,
      input.birth,
      input.calendar
    );
    if (!sameName || !sameActualBirthDate) return null;
  }
  return {
    orderId: row.order_id,
    saju,
    expiresAt: toISOString(row.expires_at),
  };
}
