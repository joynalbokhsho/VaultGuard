import { prisma } from "@/lib/db/prisma";

export async function createAuditLog({
  userId,
  action,
  ipAddress,
  userAgent,
  metadata,
}: {
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export async function getAuditLogs(userId: string, limit: number = 50, offset: number = 0) {
  try {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        action: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Failed to get audit logs:", error);
    return [];
  }
}
