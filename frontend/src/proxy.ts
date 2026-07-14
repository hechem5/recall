import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const session = await getSession();

  // Protect all routes except /login and /api/auth
  if (!session.isLoggedIn && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in, don't allow accessing /login page
  if (session.isLoggedIn && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
