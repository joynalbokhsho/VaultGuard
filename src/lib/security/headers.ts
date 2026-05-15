/**
 * SECURITY HEADERS
 * =================
 * Applied via Next.js middleware to ALL responses.
 */

import { NextResponse } from "next/server";

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers;

  // Prevent clickjacking
  headers.set("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  headers.set("X-Content-Type-Options", "nosniff");

  // XSS protection (legacy browsers)
  headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — restrict sensitive browser APIs
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()"
  );

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content Security Policy
  const csp = buildCSP();
  headers.set("Content-Security-Policy", csp);

  return response;
}

function buildCSP(): string {
  const isDev = process.env.NODE_ENV === "development";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'", // Required for Next.js hydration & theme script
      isDev ? "'unsafe-eval'" : "",
      "https://fonts.googleapis.com",
    ].filter(Boolean),
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind & Framer Motion
      "https://fonts.googleapis.com",
    ],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "connect-src": [
      "'self'",
      "https://api.pwnedpasswords.com", // HaveIBeenPwned
      isDev ? "ws://localhost:*" : "", // Next.js HMR
    ].filter(Boolean),
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "upgrade-insecure-requests": process.env.NODE_ENV === "production" ? [""] : [],
  };

  return Object.entries(directives)
    .filter(([, values]) => values.length > 0)
    .map(([directive, values]) =>
      values[0] === "" ? directive : `${directive} ${values.join(" ")}`
    )
    .join("; ");
}
