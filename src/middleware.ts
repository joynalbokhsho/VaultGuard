import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";

/**
 * NEXT.JS MIDDLEWARE
 * ===================
 * Runs on EVERY request before it reaches the route handler.
 * Responsibilities:
 * 1. Apply security headers to all responses
 * 2. Protect dashboard routes (redirect to login if unauthenticated)
 * 3. Redirect authenticated users away from auth pages
 */

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/vault",
  "/generator",
  "/settings",
  "/sessions",
  "/2fa",
  "/recovery",
];

// Auth routes (redirect to vault if already logged in)
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Build response early so we can add headers
  let response = NextResponse.next();

  // Apply security headers to ALL responses
  response = applySecurityHeaders(response);

  // Check session cookie (including secure production variants)
  const sessionCookie =
    req.cookies.get("vaultguard.session_token") ??
    req.cookies.get("__Secure-vaultguard.session_token") ??
    req.cookies.get("better-auth.session_token") ??
    req.cookies.get("__Secure-better-auth.session_token");

  const isAuthenticated = !!sessionCookie?.value;

  // Protect dashboard routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users from auth pages to vault
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/vault", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apply middleware to all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
