"use client";

import { Sun, Moon, Lock, Unlock, Menu, Timer } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { useCallback, useState } from "react";
import { useInactivityTimer, formatCountdown } from "@/hooks/useInactivityTimer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const countdownColorClass =
    secondsLeft <= 30
      ? "text-destructive"
      : isWarning
      ? "text-yellow-500"
      : "text-green-500";

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/30 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileSidebar(true)}
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
              isUnlocked ? "text-green-500" : "text-muted-foreground"
            )}>
              {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              Vault {isUnlocked ? "Unlocked" : "Locked"}
            </span>
          </div>

          {isUnlocked ? (
            <p className={cn(
              "hidden sm:flex items-center gap-1.5 text-[10px] font-medium mt-0.5 transition-colors duration-500",
              countdownColorClass
            )}>
              <Timer className="w-2.5 h-2.5" />
              {isWarning
                ? <>Auto-locks in <span className="font-mono">{formatCountdown(secondsLeft)}</span></>
                : <>Session secured · Auto-locks on inactivity</>
              }
            </p>
          ) : (
            <p className="hidden sm:block text-[10px] text-muted-foreground font-medium mt-0.5">
              Enter master password to access encrypted data
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={toggleTheme}
          className="bg-background/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}
