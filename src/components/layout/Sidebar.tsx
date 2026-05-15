"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Vault, KeyRound, Settings, Monitor, LifeBuoy, Shield, LogOut, Lock, X } from "lucide-react";
import { signOut } from "@/lib/auth/auth-client";
import { useVaultStore } from "@/store/vaultStore";
import { useRouter } from "next/navigation";

const C = {
  bg: "#0d0d1a",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#8b5cf6",
  hover: "#1a1a2e",
  activeBg: "rgba(139,92,246,0.12)",
  destructive: "#ef4444",
};

const navItems = [
  { href: "/vault",     label: "My Vault",         icon: Vault },
  { href: "/generator", label: "Generator",         icon: KeyRound },
  { href: "/sessions",  label: "Sessions",          icon: Monitor },
  { href: "/settings",  label: "Settings",          icon: Settings },
  { href: "/recovery",  label: "Recovery",          icon: LifeBuoy },
  { href: "/2fa",       label: "Two-Factor Auth",   icon: Shield },
];

interface SidebarProps {
  user: { email: string; name?: string | null; role?: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isUnlocked, lockVault, isMobileSidebarOpen, setMobileSidebar } = useVaultStore();

  const handleSignOut = async () => {
    lockVault();
    await signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 md:relative transform transition-transform duration-200 flex flex-col h-[100dvh] overflow-hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ width: 260, minWidth: 260, borderRight: `1px solid ${C.border}`, backgroundColor: C.bg }}
      >
        {/* Brand */}
        <div style={{ height: 64, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#fff", flex: 1 }}>VaultGuard</span>
          
          <button 
            className="md:hidden p-1 text-[rgb(var(--muted-foreground))] hover:text-white transition-colors" 
            onClick={() => setMobileSidebar(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

      {/* Vault status */}
      <div style={{ padding: "12px 16px", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
          backgroundColor: isUnlocked ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isUnlocked ? "rgba(52,211,153,0.2)" : C.border}`,
          color: isUnlocked ? "#34d399" : C.fgMuted,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: isUnlocked ? "#34d399" : C.fgMuted }} />
          <span style={{ flex: 1 }}>{isUnlocked ? "Vault unlocked" : "Vault locked"}</span>
          {isUnlocked && (
            <button onClick={lockVault} title="Lock vault"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#34d399", display: "flex", padding: 0 }}>
              <Lock size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none", color: isActive ? C.primary : C.fgMuted, backgroundColor: isActive ? C.activeBg : "transparent", transition: "all 0.15s", position: "relative" }}>
              {isActive && (
                <motion.div layoutId="nav-active"
                  style={{ position: "absolute", inset: 0, borderRadius: 8, backgroundColor: C.activeBg }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <item.icon size={16} style={{ position: "relative", zIndex: 1 }} />
              <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Nav */}
      {user.role === "admin" && (
        <div style={{ marginTop: "auto", padding: "8px 12px", borderTop: `1px solid ${C.border}` }}>
          <p style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, color: C.fgMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Administration</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { href: "/admin", label: "Dashboard", icon: ShieldCheck },
              { href: "/admin/users", label: "Users", icon: Monitor },
              { href: "/admin/audit", label: "Audit Logs", icon: Shield },
            ].map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none", color: isActive ? C.primary : C.fgMuted, backgroundColor: isActive ? C.activeBg : "transparent", transition: "all 0.15s", position: "relative" }}>
                  <item.icon size={15} style={{ position: "relative", zIndex: 1 }} />
                  <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* User */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: 16, flexShrink: 0, marginTop: user.role !== "admin" ? "auto" : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: "rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
            {(user.name ?? user.email)[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name ?? "User"}</p>
            <p style={{ fontSize: 11, color: C.fgMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: C.fgMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.destructive; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.fgMuted; e.currentTarget.style.backgroundColor = "transparent"; }}>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
    </>
  );
}
