
import { NextResponse } from "next/server";
import type { SajuAccessInput } from "../../../../lib/paymentAccess";
import { savePendingPayment } from "../../../../lib/paymentPending";

function json(
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = String(body?.orderId || "").trim();

    if (
      !orderId ||
      !/^MYEONGUN-[A-Za-z0-9_-]+$/.test(orderId) ||
      orderId.length > 100
    ) {
      return json(
        { message: "유효하지 않은 주문번호입니다." },
        400
      );
    }

    const input = body?.saju;

    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      return json(
        {
          message:
            "결제에 연결할 사주 정보가 없습니다.",
        },
        400
      );
    }

    const saju: SajuAccessInput = {
      name: String(input.name || "").trim(),
      birth: String(input.birth || "").trim(),
      time: String(input.time || "").trim(),
      gender: String(input.gender || "").trim(),
      calendar: String(input.calendar || "").trim(),
    };

    if (
      !saju.name ||
      !saju.birth ||
      !saju.time ||
      !saju.gender ||
      !saju.calendar
    ) {
      return json(
        {
          message:
            "이름, 생년월일, 출생시간, 성별, 양력/음력 정보를 모두 입력해주세요.",
        },
        400
      );
    }

    const pending = await savePendingPayment(
      orderId,
      saju
    );

    return json({
      ok: true,
      orderId,
      expiresAt: pending.expiresAt,
    });
  } catch (error) {
    console.error("결제 준비 오류:", error);

    if (
      error instanceof Error &&
      (
        error.message.includes("이미 다른 사주 정보") ||
        error.message.includes("결제 준비 시간이 만료") ||
        error.message.includes("새 주문번호로 다시 시도")
      )
    ) {
      return json(
        { message: error.message },
        409
      );
    }

    return json(
      {
        message:
          "결제 준비 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      500
    );
  }
}
