"use client";

/**
 * INACTIVITY AUTO-LOCK HOOK
 * ==========================
 * Locks the vault automatically after a configurable period of inactivity.
 * Resets on any user interaction (mouse, keyboard, touch).
 *
 * Security: when vault locks, the master key is purged from memory.
 */

import { useEffect, useCallback, useRef } from "react";
import { useVaultStore } from "@/store/vaultStore";

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

interface UseInactivityLockOptions {
  timeoutMs?: number;
  enabled?: boolean;
}

export function useInactivityLock({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  enabled = true,
}: UseInactivityLockOptions = {}) {
  const { isUnlocked, lockVault } = useVaultStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (!isUnlocked || !enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      lockVault();
    }, timeoutMs);
  }, [isUnlocked, enabled, timeoutMs, lockVault]);

  useEffect(() => {
    if (!isUnlocked || !enabled) return;

    // Start timer
    resetTimer();

    // Listen for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "wheel",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Also lock when tab becomes hidden (user switches away)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Start a shorter timer when tab is hidden
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          lockVault();
        }, Math.min(timeoutMs, 5 * 60 * 1000)); // Max 5 min when hidden
      } else {
        resetTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isUnlocked, enabled, resetTimer, lockVault, timeoutMs]);
}
