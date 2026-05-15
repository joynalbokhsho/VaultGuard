"use client";

/**
 * VAULT STORE (ZUSTAND — CLIENT ONLY)
 * =====================================
 * Stores the derived encryption key IN MEMORY ONLY.
 * - Never persisted to localStorage, sessionStorage, or cookies
 * - Cleared automatically on vault lock, logout, or inactivity timeout
 * - If the page is refreshed, the key is gone and master password re-entry is required
 *
 * ZERO-KNOWLEDGE GUARANTEE:
 * The masterKey (CryptoKey) exists only in JS heap memory.
 * It cannot be serialized, exported (non-extractable), or recovered.
 */

import { create } from "zustand";
import type { VaultEntryData, EntryType } from "@/lib/crypto/vault";

export interface DecryptedEntry {
  id: string;
  type: EntryType;
  isFavorite: boolean;
  data: VaultEntryData;
  createdAt: string;
  updatedAt: string;
}

interface VaultState {
  // Encryption key — non-extractable CryptoKey, lives only in memory
  masterKey: CryptoKey | null;

  // Vault unlock state
  isUnlocked: boolean;
  isUnlocking: boolean;

  // Decrypted entries (in-memory only)
  entries: DecryptedEntry[];
  
  // UI state
  searchQuery: string;
  activeCategory: EntryType | "ALL" | "FAVORITES";
  selectedEntryId: string | null;
  isMobileSidebarOpen: boolean;

  // Auto-lock setting (persisted)
  autoLockMinutes: number;

  // Actions
  setMasterKey: (key: CryptoKey) => void;
  lockVault: () => void;
  setUnlocking: (value: boolean) => void;
  setEntries: (entries: DecryptedEntry[]) => void;
  addEntry: (entry: DecryptedEntry) => void;
  updateEntry: (id: string, entry: Partial<DecryptedEntry>) => void;
  removeEntry: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: EntryType | "ALL" | "FAVORITES") => void;
  setSelectedEntryId: (id: string | null) => void;
  setMobileSidebar: (isOpen: boolean) => void;
  setAutoLockMinutes: (minutes: number) => void;
}

export const useVaultStore = create<VaultState>()((set) => ({
  masterKey: null,
  isUnlocked: false,
  isUnlocking: false,
  entries: [],
  searchQuery: "",
  activeCategory: "ALL",
  selectedEntryId: null,
  isMobileSidebarOpen: false,
  autoLockMinutes: typeof window !== "undefined"
    ? Number(localStorage.getItem("vaultguard-autolock") ?? 15)
    : 15,

  setMasterKey: (key) =>
    set({ masterKey: key, isUnlocked: true, isUnlocking: false }),

  lockVault: () =>
    set({
      masterKey: null,
      isUnlocked: false,
      entries: [],
      selectedEntryId: null,
      searchQuery: "",
    }),

  setUnlocking: (value) => set({ isUnlocking: value }),

  setEntries: (entries) => set({ entries }),

  addEntry: (entry) =>
    set((state) => ({ entries: [entry, ...state.entries] })),

  updateEntry: (id, updated) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updated } : e
      ),
    })),

  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setActiveCategory: (category) => set({ activeCategory: category }),

  setSelectedEntryId: (id) => set({ selectedEntryId: id }),

  setMobileSidebar: (isOpen) => set({ isMobileSidebarOpen: isOpen }),

  setAutoLockMinutes: (minutes) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vaultguard-autolock", String(minutes));
    }
    set({ autoLockMinutes: minutes });
  },
}));
