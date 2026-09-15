import { NextResponse } from "next/server";
import { SajuAccessInput } from "../../../../lib/paymentAccess";
import { savePendingPayment } from "../../../../lib/paymentPending";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body?.orderId || "").trim();
    const saju = (body?.saju || null) as SajuAccessInput | null;

    if (!orderId || !orderId.startsWith("MYEONGUN-")) {
      return NextResponse.json(
        { message: "유효하지 않은 주문번호입니다." },
        { status: 400 }
      );
    }

    if (!saju?.name || !saju?.birth || !saju?.time) {
      return NextResponse.json(
        { message: "결제에 연결할 사주 정보가 없습니다." },
        { status: 400 }
      );
    }

    const pending = await savePendingPayment(orderId, saju);

    return NextResponse.json(
      { ok: true, orderId, expiresAt: pending.expiresAt },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("결제 준비 오류:", error);
    return NextResponse.json(
      { message: "결제 준비 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}