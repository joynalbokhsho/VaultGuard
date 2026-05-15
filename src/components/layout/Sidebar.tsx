"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Vault, KeyRound, Settings, Monitor, LifeBuoy, Shield, LogOut, Lock, X } from "lucide-react";
import { signOut } from "@/lib/auth/auth-client";
import { useVaultStore } from "@/store/vaultStore";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
    window.location.href = "/login";
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
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:relative transform transition-transform duration-200 flex flex-col h-[100dvh] overflow-hidden bg-card border-r border-border w-[260px]",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight flex-1">VaultGuard</span>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setMobileSidebar(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Vault status */}
        <div className="p-4 shrink-0">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
            isUnlocked 
              ? "bg-green-500/5 border-green-500/20 text-green-500" 
              : "bg-muted/30 border-border text-muted-foreground"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              isUnlocked ? "bg-green-500" : "bg-muted-foreground/50"
            )} />
            <span className="flex-1">{isUnlocked ? "Vault unlocked" : "Vault locked"}</span>
            {isUnlocked && (
              <Button 
                variant="ghost" 
                size="icon-xs" 
                className="h-5 w-5 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                onClick={lockVault}
                title="Lock vault"
              >
                <Lock className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all relative",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-md bg-primary/10 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} 
                  />
                )}
                <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Nav */}
        {user.role === "admin" && (
          <div className="mt-auto px-3 py-2 border-t border-border bg-muted/20">
            <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Administration</p>
            <div className="space-y-1">
              {[
                { href: "/admin", label: "Dashboard", icon: ShieldCheck },
                { href: "/admin/users", label: "Users", icon: Monitor },
                { href: "/admin/audit", label: "Audit Logs", icon: Shield },
              ].map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                      isActive 
                        ? "text-primary bg-primary/5" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* User */}
        <div className={cn(
          "border-t border-border p-4 shrink-0 bg-background/50",
          user.role !== "admin" && "mt-auto"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8 rounded-lg">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20">
                {(user.name ?? user.email)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate leading-tight">{user.name ?? "User"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-9"
            onClick={handleSignOut}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
