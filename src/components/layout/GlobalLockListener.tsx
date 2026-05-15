"use client";

import { useInactivityLock } from "@/hooks/useInactivityLock";

export function GlobalLockListener() {
  useInactivityLock();
  return null;
}
