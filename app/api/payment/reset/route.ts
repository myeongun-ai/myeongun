import { NextResponse } from "next/server";
import { entitlementCookie } from "../../../../lib/paymentAccess";

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );

  response.cookies.set(entitlementCookie.name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("myeongun_paid", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
