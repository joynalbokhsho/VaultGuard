"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const IDLE_DETECT_SECONDS = 5;  // Show countdown after 5s of no activity
const DEFAULT_TIMEOUT_SECONDS = 15 * 60;
const WARN_SECONDS = 120; // warn when 2 min left

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
  timeoutSeconds?: number;
}

/**
 * Returns the number of seconds remaining before the vault auto-locks.
 * Resets on any user activity. Calls `onExpire` when time runs out.
 * Exposes `isIdle` which becomes true after IDLE_DETECT_SECONDS of no activity.
 */
export function useInactivityTimer({ enabled, onExpire, timeoutSeconds }: UseInactivityTimerOptions) {
  const timeout = timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;
  const [secondsLeft, setSecondsLeft] = useState(timeout);
  const [isIdle, setIsIdle] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref fresh without re-triggering effects
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdle(false);

    // Reset the idle detection timer
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_DETECT_SECONDS * 1000);
  }, []);

  // Reset timeout value when it changes
  useEffect(() => {
    if (!enabled) return;
    setSecondsLeft(timeout);
    lastActivityRef.current = Date.now();
  }, [timeout, enabled]);

  useEffect(() => {
    if (!enabled) {
      setSecondsLeft(timeout);
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    // Start idle detection immediately
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_DETECT_SECONDS * 1000);

    // Attach activity listeners
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    );

    // Tick every second
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, timeout - elapsed);
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
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [enabled, resetTimer, timeout]);

  const isWarning = secondsLeft <= WARN_SECONDS;

  return { secondsLeft, isWarning, isIdle };
}

/** Format seconds as "m:ss" */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
