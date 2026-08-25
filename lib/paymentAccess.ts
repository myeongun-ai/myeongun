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

export function hashReopen(input: Pick<SajuAccessInput, "name" | "birth">) {
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

export function createEntitlement(orderId: string, saju: SajuAccessInput) {
  const payload: EntitlementPayload = {
    v: 1,
    orderId,
    sajuHash: hashSaju(saju),
    reopenHash: hashReopen(saju),
    exp: Math.floor(Date.now() / 1000) + SEVEN_DAYS,
  };

  const encoded = encodePayload(payload);
  return `${encoded}.${signEncoded(encoded)}`;
}

export function verifyEntitlement(token: string | undefined | null) {
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
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export const entitlementCookie = {
  name: COOKIE_NAME,
  maxAge: SEVEN_DAYS,
};
