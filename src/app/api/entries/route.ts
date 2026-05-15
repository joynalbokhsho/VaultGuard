/**
 * ENTRIES API ROUTES
 * ===================
 * GET  /api/entries — List entry metadata (NOT decrypted)
 * POST /api/entries — Create encrypted entry
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { RateLimits } from "@/lib/security/rateLimit";
import { parseBody, isErrorResponse } from "@/lib/security/sanitize";
import { createEntrySchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/security/audit";
import { headers } from "next/headers";

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session.user;
}

// GET /api/entries
export async function GET(req: NextRequest) {
  const rateLimit = RateLimits.read(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vault = await prisma.vault.findUnique({ where: { userId: user.id } });
  if (!vault) return NextResponse.json({ entries: [] });

  // Only return metadata (non-sensitive) + encrypted blob
  // The client decrypts each entry locally
  const entries = await prisma.encryptedEntry.findMany({
    where: { vaultId: vault.id },
    select: {
      id: true,
      type: true,
      isFavorite: true,
      encryptedData: true,
      iv: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ entries });
}

// POST /api/entries
export async function POST(req: NextRequest) {
  const rateLimit = RateLimits.vault(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await parseBody(req, createEntrySchema);
  if (isErrorResponse(body)) return body;

  const vault = await prisma.vault.findUnique({ where: { userId: user.id } });
  if (!vault) {
    return NextResponse.json({ error: "Vault not found. Set up your vault first." }, { status: 404 });
  }

  const entry = await prisma.encryptedEntry.create({
    data: {
      vaultId: vault.id,
      encryptedData: body.encryptedData,
      iv: body.iv,
      type: body.type,
      isFavorite: body.isFavorite ?? false,
    },
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined;
  await createAuditLog({
    userId: user.id,
    action: "ENTRY_CREATE",
    ipAddress: ip,
    metadata: { entryId: entry.id, type: entry.type },
  });

  return NextResponse.json(
    {
      entry: {
        id: entry.id,
        type: entry.type,
        isFavorite: entry.isFavorite,
        createdAt: entry.createdAt,
      },
    },
    { status: 201 }
  );
}
