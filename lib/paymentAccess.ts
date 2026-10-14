
import { createHmac, timingSafeEqual } from "crypto";

export type SajuAccessInput = {
  name?: string;
  birth?: string;
  time?: string;
  gender?: string;
  calendar?: string;
};

type EntitlementPayload = {
  v: 1;
  orderId: string;
  sajuHash: string;
  reopenHash: string;
  exp: number;
};

const COOKIE_NAME = "myeongun_entitlement";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function getSigningKey() {
  const tossSecret = process.env.TOSS_SECRET_KEY;

  if (!tossSecret) {
    throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  }

  return createHmac("sha256", tossSecret)
    .update("myeongun-access-v1")
    .digest();
}

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function canonicalSaju(saju: SajuAccessInput) {
  return [
    normalize(saju.name),
    normalize(saju.birth),
    normalize(saju.time),
    normalize(saju.gender),
    normalize(saju.calendar),
  ].join("|");
}

function canonicalReopen(saju: Pick<SajuAccessInput, "name" | "birth">) {
  return [normalize(saju.name), normalize(saju.birth)].join("|");
}

export function hashSaju(saju: SajuAccessInput) {
  return createHmac("sha256", getSigningKey())
    .update(canonicalSaju(saju))
    .digest("hex");
}

export function hashReopen(
  input: Pick<SajuAccessInput, "name" | "birth">
) {
  return createHmac("sha256", getSigningKey())
    .update(canonicalReopen(input))
    .digest("hex");
}

function encodePayload(payload: EntitlementPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signEncoded(encoded: string) {
  return createHmac("sha256", getSigningKey())
    .update(encoded)
    .digest("base64url");
}

/**
 * 기존 호출 방식:
 * createEntitlement(orderId, saju)
 *
 * 최초 결제 만료일을 유지해야 하는 경우:
 * createEntitlement(orderId, saju, expiresAt)
 *
 * expiresAt은 ISO 날짜 문자열, Date 또는 Unix 초 단위 숫자입니다.
 */
export function createEntitlement(
  orderId: string,
  saju: SajuAccessInput,
  expiresAt?: string | Date | number
) {
  const now = Math.floor(Date.now() / 1000);
  let exp = now + SEVEN_DAYS;

  if (expiresAt !== undefined) {
    if (typeof expiresAt === "number") {
      exp = Math.floor(expiresAt);
    } else {
      const date = new Date(expiresAt);
      exp = Math.floor(date.getTime() / 1000);
    }

    if (!Number.isFinite(exp) || exp <= now) {
      throw new Error("이용권 만료일이 유효하지 않거나 만료되었습니다.");
    }
  }

  const payload: EntitlementPayload = {
    v: 1,
    orderId,
    sajuHash: hashSaju(saju),
    reopenHash: hashReopen(saju),
    exp,
  };

  const encoded = encodePayload(payload);
  return `${encoded}.${signEncoded(encoded)}`;
}

export function verifyEntitlement(
  token: string | undefined | null
) {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signEncoded(encoded);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as EntitlementPayload;

    if (payload.v !== 1) return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function entitlementRemainingSeconds(expiresAt: string | Date | number) {
  const exp =
    typeof expiresAt === "number"
      ? Math.floor(expiresAt)
      : Math.floor(new Date(expiresAt).getTime() / 1000);

  if (!Number.isFinite(exp)) return 0;

  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}

export const entitlementCookie = {
  name: COOKIE_NAME,
  maxAge: SEVEN_DAYS,
};
