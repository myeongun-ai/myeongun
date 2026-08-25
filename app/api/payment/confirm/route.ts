import { NextResponse } from "next/server";

const PREMIUM_PRICE = 9900;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paymentKey = String(body?.paymentKey || "").trim();
    const orderId = String(body?.orderId || "").trim();
    const amount = Number(body?.amount);

    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      return NextResponse.json(
        { message: "결제 승인 정보가 부족합니다." },
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
            "토스 결제 승인 요청이 정상적으로 처리되지 않았습니다.",
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

    const nextResponse = NextResponse.json(
      {
        ok: true,
        orderId,
        amount: PREMIUM_PRICE,
        status: result?.status || "DONE",
      },
      { status: 200 }
    );

    nextResponse.cookies.set("myeongun_paid", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
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
