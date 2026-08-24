import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { message: "결제 정보가 없습니다." },
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

    const encodedSecretKey =
      Buffer.from(`${secretKey}:`).toString("base64");

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
          amount,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, {
        status: response.status,
      });
    }

    // 결제 승인 성공
    const nextResponse = NextResponse.json(result, {
      status: response.status,
    });

    // 결제 완료 쿠키 발급
    nextResponse.cookies.set("myeongun_paid", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
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