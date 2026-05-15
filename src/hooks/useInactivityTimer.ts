"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const TIMEOUT_SECONDS = 15 * 60; // 15 minutes
const WARN_SECONDS = 120;        // warn when 2 min left

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
];

interface UseInactivityTimerOptions {
  enabled: boolean;
  onExpire: () => void;
}

/**
 * Returns the number of seconds remaining before the vault auto-locks.
 * Resets on any user activity. Calls `onExpire` when time runs out.
 */
export function useInactivityTimer({ enabled, onExpire }: UseInactivityTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref fresh without re-triggering effects
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSecondsLeft(TIMEOUT_SECONDS);
      return;
    }

    // Attach activity listeners
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );

    // Tick every second
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, TIMEOUT_SECONDS - elapsed);
      setSecondsLeft(remaining);

      if (remaining === 0) {
        onExpireRef.current();
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, resetTimer]);

  const isWarning = secondsLeft <= WARN_SECONDS;

  return { secondsLeft, isWarning };
}

/** Format seconds as "m:ss" */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
