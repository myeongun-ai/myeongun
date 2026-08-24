import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { paymentKey, orderId, amount } = body;

    // 필수값 확인
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        {
          success: false,
          message: "결제 정보가 부족합니다.",
        },
        { status: 400 }
      );
    }

    // 서버에 저장된 토스 시크릿 키
    const secretKey = process.env.TOSS_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          message: "TOSS_SECRET_KEY가 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    // 토스 Basic 인증
    const encodedKey = Buffer.from(`${secretKey}:`).toString("base64");

    // 토스 결제 승인 요청
    const response = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodedKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "결제 승인에 실패했습니다.",
          code: result.code,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      payment: result,
    });
  } catch (error) {
    console.error("Toss payment confirm error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "결제 승인 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}