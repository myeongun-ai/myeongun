import { NextResponse } from "next/server";
import {
  createEntitlement,
  entitlementCookie,
  SajuAccessInput,
} from "../../../../lib/paymentAccess";
import { saveCrossDeviceReopen } from "../../../../lib/reopenStore";

const PREMIUM_PRICE = 9900;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paymentKey = String(body?.paymentKey || "").trim();
    const orderId = String(body?.orderId || "").trim();
    const amount = Number(body?.amount);
    const saju = (body?.saju || null) as SajuAccessInput | null;

    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      return NextResponse.json(
        { message: "결제 승인 정보가 부족합니다." },
        { status: 400 }
      );
    }

    if (!saju?.name || !saju?.birth || !saju?.time) {
      return NextResponse.json(
        { message: "결제에 연결할 사주 정보가 없습니다." },
        { status: 400 }
      );
    }

    if (amount !== PREMIUM_PRICE) {
      return NextResponse.json(
        { message: "결제 금액이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    if (!orderId.startsWith("MYEONGUN-")) {
      return NextResponse.json(
        { message: "유효하지 않은 주문번호입니다." },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOSS_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { message: "토스 시크릿 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const encodedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodedSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: PREMIUM_PRICE,
        }),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            result?.message ||
            "토스 결제 승인 요청을 정상적으로 처리하지 못했습니다.",
          code: result?.code,
        },
        { status: response.status }
      );
    }

    if (result?.orderId && result.orderId !== orderId) {
      return NextResponse.json(
        { message: "승인된 주문번호가 요청 정보와 일치하지 않습니다." },
        { status: 400 }
      );
    }

    if (
      typeof result?.totalAmount === "number" &&
      result.totalAmount !== PREMIUM_PRICE
    ) {
      return NextResponse.json(
        { message: "승인된 결제 금액이 상품 금액과 일치하지 않습니다." },
        { status: 400 }
      );
    }

    const entitlement = createEntitlement(orderId, saju);
    const reopen = await saveCrossDeviceReopen(orderId, saju);

    const nextResponse = NextResponse.json(
      {
        ok: true,
        orderId,
        amount: PREMIUM_PRICE,
        status: result?.status || "DONE",
        reopenDays: reopen.reopenDays,
        reopenCode: reopen.code,
        reopenExpiresAt: reopen.expiresAt,
      },
      { status: 200 }
    );

    nextResponse.cookies.set(entitlementCookie.name, entitlement, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: entitlementCookie.maxAge,
    });

    // 과거 버전 쿠키 제거
    nextResponse.cookies.set("myeongun_paid", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return nextResponse;
  } catch (error) {
    console.error("결제 승인 오류:", error);

    return NextResponse.json(
      { message: "결제 승인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
