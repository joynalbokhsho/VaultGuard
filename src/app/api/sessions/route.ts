/**
 * SESSIONS API
 * =============
 * GET    /api/sessions — List active sessions
 * DELETE /api/sessions — Revoke all other sessions
 * DELETE /api/sessions/[id] — Revoke specific session
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { RateLimits } from "@/lib/security/rateLimit";
import { createAuditLog } from "@/lib/security/audit";
import { headers } from "next/headers";

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session.user;
}

// GET /api/sessions
export async function GET(req: NextRequest) {
  const rateLimit = RateLimits.read(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

// DELETE /api/sessions — Revoke all sessions except current
export async function DELETE(req: NextRequest) {
  const rateLimit = RateLimits.vault(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentSession = await auth.api.getSession({ headers: await headers() });
  const currentToken = currentSession?.session?.token;

  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      NOT: { token: currentToken },
    },
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined;
  await createAuditLog({
    userId: user.id,
    action: "SESSION_REVOKE",
    ipAddress: ip,
    metadata: { type: "all_other_sessions" },
  });

  return NextResponse.json({ success: true });
}
