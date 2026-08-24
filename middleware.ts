import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const paid = request.cookies.get("myeongun_paid")?.value;

  if (request.nextUrl.pathname === "/fortune/detail") {
    if (paid !== "true") {
      return NextResponse.redirect(
        new URL("/payment", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/fortune/detail"],
};