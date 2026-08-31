import { NextResponse } from "next/server";
import {
  createEntitlement,
  entitlementCookie,
} from "../../../../lib/paymentAccess";
import { redeemCrossDeviceReopen } from "../../../../lib/reopenStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body?.name || "").trim();
    const birth = String(body?.birth || "").trim();
    const code = String(body?.code || "").trim();

    if (!name || !birth || !code) {
      return NextResponse.json(
        { message: "이름, 생년월일, 재열람 코드를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const reopened = await redeemCrossDeviceReopen({ name, birth, code });

    if (!reopened) {
      return NextResponse.json(
        {
          message:
            "결제 정보와 일치하지 않거나 재열람 기간이 만료되었습니다. 입력 정보를 다시 확인해주세요.",
        },
        { status: 403 }
      );
    }

    const entitlement = createEntitlement(reopened.orderId, reopened.saju);

    const response = NextResponse.json(
      {
        ok: true,
        saju: reopened.saju,
        expiresAt: reopened.expiresAt,
      },
      { status: 200 }
    );

    response.cookies.set(entitlementCookie.name, entitlement, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: entitlementCookie.maxAge,
    });

    return response;
  } catch (error) {
    console.error("상세 사주 재열람 오류:", error);

    return NextResponse.json(
      { message: "재열람 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
