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
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden font-sans">
      <GlobalLockListener />
      <Sidebar user={userWithRole} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DashboardNavbar user={userWithRole} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
