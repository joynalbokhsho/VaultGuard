import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const skip = parseInt(searchParams.get("skip") || "0");
  const take = parseInt(searchParams.get("take") || "50");

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } }
      }
    }),
    prisma.auditLog.count()
  ]);

  return NextResponse.json({ logs, total });
}
