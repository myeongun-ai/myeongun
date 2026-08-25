import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const paid = request.cookies.get("myeongun_paid")?.value === "true";

  return NextResponse.json(
    { paid },
    {
      status: paid ? 200 : 401,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
