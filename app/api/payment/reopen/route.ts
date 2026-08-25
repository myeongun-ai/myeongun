import { NextRequest, NextResponse } from "next/server";
import {
  entitlementCookie,
  hashReopen,
  verifyEntitlement,
} from "../../../../lib/paymentAccess";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body?.name || "").trim();
    const birth = String(body?.birth || "").trim();

    if (!name || !birth) {
      return NextResponse.json(
        { ok: false, message: "이름과 생년월일을 입력해주세요." },
        { status: 400 }
      );
    }

    const token = request.cookies.get(entitlementCookie.name)?.value;
    const entitlement = verifyEntitlement(token);

    if (!entitlement) {
      return NextResponse.json(
        { ok: false, message: "재열람 가능한 이용권이 없습니다." },
        { status: 401 }
      );
    }

    if (entitlement.reopenHash !== hashReopen({ name, birth })) {
      return NextResponse.json(
        { ok: false, message: "결제한 사주 정보와 일치하지 않습니다." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        expiresAt: entitlement.exp,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: "재열람 확인 중 오류가 발생했습니다." },
      { status: 400 }
    );
  }
}
