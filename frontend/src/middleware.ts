import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const session = await getSession();

  // Protect all routes except /unlock and /api/auth
  if (!session.isLoggedIn && !request.nextUrl.pathname.startsWith('/unlock') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL("/unlock", request.url));
  }

  // If logged in, don't allow accessing /unlock page
  if (session.isLoggedIn && request.nextUrl.pathname.startsWith('/unlock')) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
