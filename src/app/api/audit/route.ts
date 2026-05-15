/**
 * AUDIT LOG API
 * ==============
 * GET /api/audit — Fetch user's audit log
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { RateLimits } from "@/lib/security/rateLimit";
import { getAuditLogs } from "@/lib/security/audit";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const rateLimit = RateLimits.read(req);
  if (rateLimit) return rateLimit;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const logs = await getAuditLogs(session.user.id, limit, offset);

  return NextResponse.json({ logs });
}
