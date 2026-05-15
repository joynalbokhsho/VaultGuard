/**
 * VAULT API ROUTES
 * =================
 * GET  /api/vault — Get user's vault (encrypted blob + salt)
 * POST /api/vault — Create vault (first-time setup)
 * PUT  /api/vault — Update vault encrypted data
 *
 * The server ONLY sees encrypted blobs. It cannot decrypt them.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { RateLimits } from "@/lib/security/rateLimit";
import { parseBody, isErrorResponse } from "@/lib/security/sanitize";
import { createVaultSchema, updateVaultSchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/security/audit";
import { headers } from "next/headers";

async function getAuthenticatedUser(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session.user;
}

// GET /api/vault
export async function GET(req: NextRequest) {
  const rateLimit = RateLimits.read(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vault = await prisma.vault.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      encryptedData: true,
      iv: true,
      createdAt: true,
      updatedAt: true,
      // Include KDF salt from user record
      user: { select: { kdfSalt: true } },
    },
  });

  if (!vault) {
    return NextResponse.json({ vault: null, kdfSalt: null });
  }

  return NextResponse.json({
    vault: {
      id: vault.id,
      encryptedData: vault.encryptedData,
      iv: vault.iv,
      createdAt: vault.createdAt,
      updatedAt: vault.updatedAt,
    },
    kdfSalt: vault.user.kdfSalt,
  });
}

// POST /api/vault — Create vault
export async function POST(req: NextRequest) {
  const rateLimit = RateLimits.vault(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if vault already exists
  const existing = await prisma.vault.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "Vault already exists" }, { status: 409 });
  }

  const body = await parseBody(req, createVaultSchema);
  if (isErrorResponse(body)) return body;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined;

  // Create vault + update user's KDF salt in one transaction
  const vault = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { kdfSalt: body.kdfSalt },
    });

    return tx.vault.create({
      data: {
        userId: user.id,
        encryptedData: body.encryptedData,
        iv: body.iv,
      },
    });
  });

  await createAuditLog({
    userId: user.id,
    action: "ENTRY_CREATE",
    ipAddress: ip,
    metadata: { type: "vault_created" },
  });

  return NextResponse.json(
    {
      vault: {
        id: vault.id,
        createdAt: vault.createdAt,
      },
    },
    { status: 201 }
  );
}

// PUT /api/vault — Update vault
export async function PUT(req: NextRequest) {
  const rateLimit = RateLimits.vault(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await parseBody(req, updateVaultSchema);
  if (isErrorResponse(body)) return body;

  const vault = await prisma.vault.update({
    where: { userId: user.id },
    data: {
      encryptedData: body.encryptedData,
      iv: body.iv,
    },
  });

  return NextResponse.json({ vault: { id: vault.id, updatedAt: vault.updatedAt } });
}
