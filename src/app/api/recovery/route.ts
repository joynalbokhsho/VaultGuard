/**
 * RECOVERY CODES API
 * ===================
 * POST /api/recovery/generate — Generate new recovery codes
 * POST /api/recovery/verify   — Use a recovery code
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { RateLimits } from "@/lib/security/rateLimit";
import { createAuditLog } from "@/lib/security/audit";
import { headers } from "next/headers";
import crypto from "crypto";

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session.user;
}

function generateRecoveryCode(): string {
  // Format: XXXX-XXXX-XXXX-XXXX (16 random hex chars)
  const bytes = crypto.randomBytes(8);
  const hex = bytes.toString("hex").toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

function hashRecoveryCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// POST /api/recovery/generate
export async function POST(req: NextRequest) {
  const rateLimit = RateLimits.auth(req);
  if (rateLimit) return rateLimit;

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Generate 8 recovery codes
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    codes.push(generateRecoveryCode());
  }

  // Delete old recovery codes and store new hashed ones
  await prisma.$transaction(async (tx) => {
    await tx.recoveryCode.deleteMany({ where: { userId: user.id } });

    await tx.recoveryCode.createMany({
      data: codes.map((code) => ({
        userId: user.id,
        codeHash: hashRecoveryCode(code),
      })),
    });
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined;
  await createAuditLog({
    userId: user.id,
    action: "RECOVERY_CODE_GENERATE",
    ipAddress: ip,
  });

  // Return plaintext codes ONCE — never stored plaintext
  return NextResponse.json({ codes });
}
