"use client";

import { Sun, Moon, Lock, Unlock, Menu, Timer } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { useCallback, useState } from "react";
import { useInactivityTimer, formatCountdown } from "@/hooks/useInactivityTimer";

const C = {
  bg: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
};

interface DashboardNavbarProps {
  user: { email: string; name?: string | null };
}

export function DashboardNavbar({ user }: DashboardNavbarProps) {
  const { isUnlocked, isMobileSidebarOpen, setMobileSidebar, lockVault } = useVaultStore();
  const [isDark, setIsDark] = useState(true);

  const handleExpire = useCallback(() => {
    lockVault();
  }, [lockVault]);

  const { secondsLeft, isWarning } = useInactivityTimer({
    enabled: isUnlocked,
    onExpire: handleExpire,
  });

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("vaultguard-theme", isDark ? "light" : "dark");
  };

  // Colour shifts: green → amber (warning) → red (critical)
  const countdownColor =
    secondsLeft <= 30
      ? "#ef4444"          // red — critical
      : isWarning
      ? "#f59e0b"          // amber — warning
      : "#10b981";         // green — safe

  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg, flexShrink: 0 }}>
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 -ml-2 text-[rgb(var(--muted-foreground))] hover:text-white transition-colors"
          onClick={() => setMobileSidebar(true)}
          aria-label="Open sidebar"
        >
          <Menu size={24} color={C.fgMuted} />
        </button>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.fg, display: "flex", alignItems: "center", gap: 6 }}>
            {isUnlocked
              ? <><Unlock size={14} color="#10b981" /> Vault unlocked</>
              : <><Lock size={14} color={C.fgMuted} /> Vault locked</>
            }
          </div>

          {isUnlocked ? (
            <p className="hidden sm:flex items-center gap-1" style={{ fontSize: 11, color: countdownColor, marginTop: 1, transition: "color 0.5s" }}>
              <Timer size={10} />
              {isWarning
                ? <>Auto-locks in <strong style={{ fontVariantNumeric: "tabular-nums" }}>{formatCountdown(secondsLeft)}</strong></>
                : <>Auto-locks after 15 minutes of inactivity</>
              }
            </p>
          ) : (
            <p className="hidden sm:block" style={{ fontSize: 11, color: C.fgMuted, marginTop: 1 }}>
              Enter your master password to unlock
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button id="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme"
          style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: C.fgMuted, background: "none", border: "none", cursor: "pointer", transition: "background-color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = C.fg; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.fgMuted; }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
