"use client";

/**
 * COPY WITH AUTO-CLEAR HOOK
 * ==========================
 * Copies sensitive data to clipboard and automatically clears it after N seconds.
 * Prevents clipboard-sniffing from reading sensitive data left in clipboard.
 */

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseCopyWithClearOptions {
  clearAfterMs?: number;
  onCopy?: () => void;
  onClear?: () => void;
}

export function useCopyWithClear({
  clearAfterMs = 30_000, // 30 seconds (NIST recommendation)
  onCopy,
  onClear,
}: UseCopyWithClearOptions = {}) {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string, label = "Copied") => {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        onCopy?.();

        // Show toast with countdown indicator
        toast.success(`${label} — will clear in ${clearAfterMs / 1000}s`, {
          duration: clearAfterMs,
        });

        // Clear any existing timer
        if (timerRef.current) clearTimeout(timerRef.current);

        // Auto-clear clipboard
        timerRef.current = setTimeout(async () => {
          try {
            // Only clear if our text is still in clipboard
            const current = await navigator.clipboard.readText();
            if (current === text) {
              await navigator.clipboard.writeText("");
            }
          } catch {
            // readText may fail without focus — that's ok
          }
          setIsCopied(false);
          onClear?.();
        }, clearAfterMs);
      } catch (err) {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy to clipboard");
      }
    },
    [clearAfterMs, onCopy, onClear]
  );

  return { isCopied, copy };
}
