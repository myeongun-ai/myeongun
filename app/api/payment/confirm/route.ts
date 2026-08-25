import { NextResponse } from "next/server";
import {
  createEntitlement,
  entitlementCookie,
  SajuAccessInput,
} from "../../../../lib/paymentAccess";

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
        { message: "寃곗젣 ?뱀씤 ?뺣낫媛 遺議깊빀?덈떎." },
        { status: 400 }
      );
    }

    if (!saju?.name || !saju?.birth || !saju?.time) {
      return NextResponse.json(
        { message: "寃곗젣???ъ＜ ?뺣낫媛 ?놁뒿?덈떎." },
        { status: 400 }
      );
    }

    if (amount !== PREMIUM_PRICE) {
      return NextResponse.json(
        { message: "寃곗젣 湲덉븸???щ컮瑜댁? ?딆뒿?덈떎." },
        { status: 400 }
      );
    }

    if (!orderId.startsWith("MYEONGUN-")) {
      return NextResponse.json(
        { message: "?좏슚?섏? ?딆? 二쇰Ц踰덊샇?낅땲??" },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOSS_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { message: "?좎뒪 ?쒗겕由??ㅺ? ?ㅼ젙?섏? ?딆븯?듬땲??" },
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
            "?좎뒪 寃곗젣 ?뱀씤 ?붿껌???뺤긽?곸쑝濡?泥섎━?섏? ?딆븯?듬땲??",
          code: result?.code,
        },
        { status: response.status }
      );
    }

    if (result?.orderId && result.orderId !== orderId) {
      return NextResponse.json(
        { message: "?뱀씤??二쇰Ц踰덊샇媛 ?붿껌 ?뺣낫? ?쇱튂?섏? ?딆뒿?덈떎." },
        { status: 400 }
      );
    }

    if (
      typeof result?.totalAmount === "number" &&
      result.totalAmount !== PREMIUM_PRICE
    ) {
      return NextResponse.json(
        { message: "?뱀씤??寃곗젣 湲덉븸???곹뭹 湲덉븸怨??쇱튂?섏? ?딆뒿?덈떎." },
        { status: 400 }
      );
    }

    const entitlement = createEntitlement(orderId, saju);

    const nextResponse = NextResponse.json(
      {
        ok: true,
        orderId,
        amount: PREMIUM_PRICE,
        status: result?.status || "DONE",
        reopenDays: 7,
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

    // 怨쇨굅 踰꾩쟾 荑좏궎???쒓굅
    nextResponse.cookies.set("myeongun_paid", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return nextResponse;
  } catch (error) {
    console.error("寃곗젣 ?뱀씤 ?ㅻ쪟:", error);

    return NextResponse.json(
      { message: "寃곗젣 ?뱀씤 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}
