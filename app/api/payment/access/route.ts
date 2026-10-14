import { NextRequest, NextResponse } from "next/server";
import {
  entitlementCookie,
  hashSaju,
  verifyEntitlement,
} from "../../../../lib/paymentAccess";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saju = body?.saju || null;

    if (!saju?.name || !saju?.birth || !saju?.time) {
      return NextResponse.json(
        { paid: false, message: "사주 정보가 부족합니다." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const token = request.cookies.get(entitlementCookie.name)?.value;
    const entitlement = verifyEntitlement(token);

    if (!entitlement) {
      return NextResponse.json(
        { paid: false },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (entitlement.sajuHash !== hashSaju(saju)) {
      return NextResponse.json(
        { paid: false, reason: "SAJU_MISMATCH" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        paid: true,
        orderId: entitlement.orderId,
        expiresAt: entitlement.exp,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { paid: false },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
