import { createHmac } from "crypto";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import {
  createEntitlement,
  entitlementCookie,
  entitlementRemainingSeconds,
} from "../../../../lib/paymentAccess";
import { redeemCrossDeviceReopen } from "../../../../lib/reopenStore";

const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 15;

function reply(message: string, status: number, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: { "Cache-Control": "no-store", ...extraHeaders },
    }
  );
}

function getClientIp(request: Request): string {
  // 배포 플랫폼이 설정하는 헤더를 사용합니다. 외부에서 전달된 X-Forwarded-For는
  // 신뢰할 수 있는 프록시가 덮어쓰는 환경에서만 신뢰할 수 있습니다.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.slice(0, 128);
  return "unknown";
}

async function registerAttempt(request: Request): Promise<{ allowed: boolean; retryAfter: number }> {
  const dbUrl = process.env.DATABASE_URL;
  const secret = process.env.TOSS_SECRET_KEY;
  if (!dbUrl || !secret) throw new Error("재열람 요청 제한 환경 설정 누락");

  const ip = getClientIp(request);
  const key = createHmac("sha256", secret)
    .update(`myeongun-reopen-rate-v1|${ip}`)
    .digest("hex");
  const sql = neon(dbUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS myeongun_reopen_rate_limit (
      client_hash TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      window_ends_at TIMESTAMPTZ NOT NULL
    )
  `;

  // UPSERT 한 문장으로 동시 요청의 시도 횟수를 원자적으로 증가시킵니다.
  // 윈도우가 끝났다면 새로운 15분 윈도우로 초기화합니다.
  const rows = await sql`
    INSERT INTO myeongun_reopen_rate_limit (
      client_hash, attempts, window_ends_at
    ) VALUES (
      ${key}, 1, NOW() + INTERVAL '15 minutes'
    )
    ON CONFLICT (client_hash) DO UPDATE SET
      attempts = CASE
        WHEN myeongun_reopen_rate_limit.window_ends_at <= NOW() THEN 1
        ELSE myeongun_reopen_rate_limit.attempts + 1
      END,
      window_ends_at = CASE
        WHEN myeongun_reopen_rate_limit.window_ends_at <= NOW()
          THEN NOW() + INTERVAL '15 minutes'
        ELSE myeongun_reopen_rate_limit.window_ends_at
      END
    RETURNING attempts, window_ends_at
  `;

  const attempts = Number(rows[0]?.attempts ?? MAX_ATTEMPTS + 1);
  const windowEnd = new Date(String(rows[0]?.window_ends_at ?? "")).getTime();
  const retryAfter = Number.isFinite(windowEnd)
    ? Math.max(1, Math.ceil((windowEnd - Date.now()) / 1000))
    : WINDOW_MINUTES * 60;
  return { allowed: attempts <= MAX_ATTEMPTS, retryAfter };
}

export async function POST(request: Request) {
  try {
    // 잘못된 형식의 요청도 반복 입력 횟수에 포함합니다.
    const attempt = await registerAttempt(request);
    if (!attempt.allowed) {
      return reply(
        "재열람 확인 요청이 많습니다. 약 15분 후 다시 시도해 주세요.",
        429,
        { "Retry-After": String(attempt.retryAfter) }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return reply("입력 정보 형식이 올바르지 않습니다.", 400);
      }
    } catch {
      return reply("입력 정보 형식이 올바르지 않습니다.", 400);
    }

    const name = String(body.name || "").trim();
    const birth = String(body.birth || "").trim();
    const code = String(body.code || "").trim();
    const calendar = String(body.calendar || "양력").trim();

    if (!name || !birth || !code) {
      return reply("이름, 생년월일, 재열람 코드를 모두 입력해주세요.", 400);
    }
    if (
      name.length > 100 ||
      birth.length > 30 ||
      code.length > 32 ||
      calendar.length > 30
    ) {
      return reply("입력 정보가 너무 깁니다.", 400);
    }

    const reopened = await redeemCrossDeviceReopen({
      name,
      birth,
      code,
      calendar,
    });

    if (!reopened) {
      return reply(
        "결제 정보와 일치하지 않거나 재열람 기간이 만료되었습니다. 입력 정보를 다시 확인해주세요.",
        403
      );
    }

    // 최초 결제 시 저장된 만료일을 그대로 사용합니다.
    const remainingSeconds = entitlementRemainingSeconds(reopened.expiresAt);
    if (remainingSeconds <= 0) {
      return reply("상세 사주 이용기간이 만료되었습니다.", 403);
    }

    const entitlement = createEntitlement(
      reopened.orderId,
      reopened.saju,
      reopened.expiresAt
    );

    const response = NextResponse.json(
      { ok: true, saju: reopened.saju, expiresAt: reopened.expiresAt },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

    response.cookies.set(entitlementCookie.name, entitlement, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: remainingSeconds,
    });
    return response;
  } catch (error) {
    console.error("상세 사주 재열람 오류:", error);
    return reply("재열람 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 500);
  }
}
