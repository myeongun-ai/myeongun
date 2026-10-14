import { NextRequest, NextResponse } from "next/server";
import {
  createEntitlement,
  entitlementCookie,
  entitlementRemainingSeconds,
  hashSaju,
  verifyEntitlement,
} from "../../../../lib/paymentAccess";
import {
  getExistingReopenForVerifiedPayment,
  saveCrossDeviceReopen,
} from "../../../../lib/reopenStore";
import { consumePendingPayment } from "../../../../lib/paymentPending";

const PREMIUM_PRICE = 9900;

type TossPayment = {
  paymentKey?: string;
  orderId?: string;
  totalAmount?: number;
  status?: string;
  code?: string;
  message?: string;
};

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function tossAuthorization(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function readTossResponse(response: Response): Promise<TossPayment> {
  try {
    return (await response.json()) as TossPayment;
  } catch {
    return {};
  }
}

async function lookupTossPayment(paymentKey: string, secretKey: string) {
  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`,
    {
      method: "GET",
      headers: { Authorization: tossAuthorization(secretKey) },
      cache: "no-store",
    }
  );
  return {
    verified: response.ok,
    payment: await readTossResponse(response),
  };
}

async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  secretKey: string
) {
  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: tossAuthorization(secretKey),
        "Content-Type": "application/json",
        "Idempotency-Key": orderId,
      },
      body: JSON.stringify({ paymentKey, orderId, amount: PREMIUM_PRICE }),
      cache: "no-store",
    }
  );
  const payment = await readTossResponse(response);
  if (response.ok) return { verified: true, payment };

  // 승인 요청의 응답이 실패했더라도 이미 승인되었을 가능성이 있습니다.
  const lookup = await lookupTossPayment(paymentKey, secretKey);
  if (lookup.verified) return lookup;
  return { verified: false, payment };
}

function isMatchingCompletedPayment(
  payment: TossPayment,
  paymentKey: string,
  orderId: string
) {
  return (
    payment.paymentKey === paymentKey &&
    payment.orderId === orderId &&
    payment.totalAmount === PREMIUM_PRICE &&
    payment.status === "DONE"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentKey = String(body?.paymentKey || "").trim();
    const orderId = String(body?.orderId || "").trim();
    const amount = Number(body?.amount);

    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      return json({ message: "결제 승인 정보가 부족합니다." }, 400);
    }
    if (amount !== PREMIUM_PRICE) {
      return json({ message: "결제 금액이 올바르지 않습니다." }, 400);
    }
    if (!/^MYEONGUN-[A-Za-z0-9_-]+$/.test(orderId) || orderId.length > 100) {
      return json({ message: "유효하지 않은 주문번호입니다." }, 400);
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      console.error("결제 승인 환경 설정 누락");
      return json({ message: "현재 결제 처리를 완료할 수 없습니다." }, 503);
    }

    // 토스 승인 요청 전에 결제 준비 정보의 유효성을 먼저 확인합니다.
    const pendingSaju = await consumePendingPayment(orderId);
    const hasPending = Boolean(
      pendingSaju?.name && pendingSaju?.birth && pendingSaju?.time &&
      pendingSaju?.gender && pendingSaju?.calendar
    );

    // 결제 준비 정보가 만료된 경우에는 신규 승인 요청을 절대 보내지 않습니다.
    // 이미 발급된 이용권을 가진 고객에게만 기존 결제의 조회를 허용합니다.
    let existing: Awaited<ReturnType<typeof getExistingReopenForVerifiedPayment>> = null;
    if (!hasPending) {
      const token = request.cookies.get(entitlementCookie.name)?.value;
      const entitlement = verifyEntitlement(token);
      if (!entitlement || entitlement.orderId !== orderId) {
        return json({
          message: "결제 준비 시간이 만료되었거나 이용권을 확인할 수 없습니다. 이미 결제하셨다면 다시 결제하지 마시고 고객센터로 문의해 주세요.",
        }, 409);
      }
      existing = await getExistingReopenForVerifiedPayment(orderId);
      if (!existing || entitlement.sajuHash !== hashSaju(existing.saju)) {
        return json({
          message: "기존 이용권 정보를 확인할 수 없습니다. 다시 결제하지 마시고 고객센터로 문의해 주세요.",
        }, 403);
      }
    }

    // 신규 승인 가능 상태에서는 승인 요청 후 결과를 검증합니다.
    // 준비 정보가 없는 기존 이용권 복구는 승인 POST 없이 조회 GET만 사용합니다.
    const tossResult = hasPending
      ? await confirmTossPayment(paymentKey, orderId, secretKey)
      : await lookupTossPayment(paymentKey, secretKey);

    if (!tossResult.verified) {
      return json({
        message: tossResult.payment.message ||
          "결제 승인 상태를 확인하지 못했습니다. 다시 결제하지 마시고 결제 내역을 확인해 주세요.",
        code: tossResult.payment.code,
      }, 502);
    }

    if (!isMatchingCompletedPayment(tossResult.payment, paymentKey, orderId)) {
      console.error("토스 결제 검증 실패", {
        orderId,
        returnedOrderId: tossResult.payment.orderId,
        status: tossResult.payment.status,
        totalAmount: tossResult.payment.totalAmount,
      });
      return json({
        message: "결제 승인 정보가 일치하지 않습니다. 다시 결제하지 마시고 고객센터로 문의해 주세요.",
      }, 409);
    }

    const saju = hasPending ? pendingSaju! : existing!.saju;
    const reopen = hasPending
      ? await saveCrossDeviceReopen(orderId, saju)
      : {
          code: existing!.code,
          expiresAt: existing!.expiresAt,
          reopenDays: existing!.reopenDays,
          alreadyIssued: true,
        };

    if (!reopen.code) {
      return json({
        message: "기존 이용코드를 자동으로 확인할 수 없습니다. 다시 결제하지 마시고 고객센터로 문의해 주세요.",
        orderId,
        alreadyIssued: true,
      }, 409);
    }

    const remainingSeconds = entitlementRemainingSeconds(reopen.expiresAt);
    if (remainingSeconds <= 0) {
      return json({ message: "기존 결제 이용기간이 만료되었습니다." }, 403);
    }

    const entitlement = createEntitlement(orderId, saju, reopen.expiresAt);
    const response = json({
      ok: true,
      orderId,
      amount: PREMIUM_PRICE,
      status: "DONE",
      reopenDays: reopen.reopenDays,
      saju,
      reopenCode: reopen.code,
      reopenExpiresAt: reopen.expiresAt,
      alreadyIssued: reopen.alreadyIssued,
    });

    response.cookies.set(entitlementCookie.name, entitlement, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: remainingSeconds,
    });
    response.cookies.set("myeongun_paid", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("결제 승인 처리 오류:", error);
    return json({
      message: "결제 처리 중 오류가 발생했습니다. 결제가 완료되었을 수 있으니 다시 결제하지 마시고 고객센터로 문의해 주세요.",
    }, 500);
  }
}
