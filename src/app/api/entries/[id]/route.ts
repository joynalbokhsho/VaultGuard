/**
 * SINGLE ENTRY API ROUTES
 * ========================
 * GET    /api/entries/[id] — Fetch single encrypted entry
 * PUT    /api/entries/[id] — Update encrypted entry
 * DELETE /api/entries/[id] — Delete entry
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { RateLimits } from "@/lib/security/rateLimit";
import { parseBody, isErrorResponse } from "@/lib/security/sanitize";
import { updateEntrySchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/security/audit";
import { headers } from "next/headers";

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session.user;
}

// Helper: Verify entry belongs to authenticated user's vault
async function getVerifiedEntry(entryId: string, userId: string) {
  const entry = await prisma.encryptedEntry.findFirst({
    where: {
      id: entryId,
      vault: { userId },
    },
  });
  return entry;
}

// GET /api/entries/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = RateLimits.read(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await getVerifiedEntry(id, user.id);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined;
  await createAuditLog({ userId: user.id, action: "ENTRY_VIEW", ipAddress: ip, metadata: { entryId: id } });

  return NextResponse.json({ entry });
}

// PUT /api/entries/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = RateLimits.vault(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getVerifiedEntry(id, user.id);
  if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const body = await parseBody(req, updateEntrySchema);
  if (isErrorResponse(body)) return body;

  const entry = await prisma.encryptedEntry.update({
    where: { id },
    data: {
      encryptedData: body.encryptedData,
      iv: body.iv,
      ...(body.isFavorite !== undefined ? { isFavorite: body.isFavorite } : {}),
    },
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined;
  await createAuditLog({ userId: user.id, action: "ENTRY_UPDATE", ipAddress: ip, metadata: { entryId: id } });

  return NextResponse.json({ entry: { id: entry.id, updatedAt: entry.updatedAt } });
}

// DELETE /api/entries/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = RateLimits.vault(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getVerifiedEntry(id, user.id);
  if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  await prisma.encryptedEntry.delete({ where: { id } });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined;
  await createAuditLog({ userId: user.id, action: "ENTRY_DELETE", ipAddress: ip, metadata: { entryId: id } });

  return NextResponse.json({ success: true });
}
