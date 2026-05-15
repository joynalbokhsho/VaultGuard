import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalVaults, totalEntries, totalSessions, totalAuditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.vault.count(),
    prisma.encryptedEntry.count(),
    prisma.session.count(),
    prisma.auditLog.count()
  ]);

  return NextResponse.json({
    totalUsers,
    totalVaults,
    totalEntries,
    totalSessions,
    totalAuditLogs
  });
}
