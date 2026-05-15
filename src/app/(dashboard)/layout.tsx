import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { GlobalLockListener } from "@/components/layout/GlobalLockListener";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const userWithRole = { ...session.user, role: dbUser?.role || "user" };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#09090f", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <GlobalLockListener />
      <Sidebar user={userWithRole} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <DashboardNavbar user={userWithRole} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ backgroundColor: "#09090f" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
