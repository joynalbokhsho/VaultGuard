"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useVaultStore } from "@/store/vaultStore";
import { useInactivityLock } from "@/hooks/useInactivityLock";
import { VaultUnlock } from "./VaultUnlock";
import { EntryList } from "./EntryList";
import { EntryModal } from "./EntryModal";
import { CategoryFilter } from "./CategoryFilter";
import { deriveMasterKey } from "@/lib/crypto/keyDerivation";
import { decryptVaultEntry } from "@/lib/crypto/vault";
import type { DecryptedEntry } from "@/store/vaultStore";
import type { EntryType } from "@/lib/crypto/vault";

const C = {
  bg: "#09090f",
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  input: "#1a1a2e",
  primary: "#7c3aed",
  primaryHover: "#6d28d9",
  ring: "rgba(124,58,237,0.2)",
};

export function VaultDashboard() {
  const {
    isUnlocked,
    masterKey,
    entries,
    searchQuery,
    activeCategory,
    setSearchQuery,
    setEntries,
    setMasterKey,
  } = useVaultStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [focused, setFocused] = useState(false);

  // Auto-lock on inactivity
  useInactivityLock({ timeoutMs: 15 * 60 * 1000 });

  // Load and decrypt entries when vault is unlocked
  const loadEntries = useCallback(async () => {
    if (!masterKey) return;
    setIsLoadingEntries(true);

    try {
      const res = await fetch("/api/entries");
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();

      const decrypted: DecryptedEntry[] = await Promise.all(
        (data.entries as Array<{
          id: string;
          type: EntryType;
          isFavorite: boolean;
          encryptedData: string;
          iv: string;
          createdAt: string;
          updatedAt: string;
        }>).map(async (entry) => {
          const entryData = await decryptVaultEntry(
            entry.encryptedData,
            entry.iv,
            masterKey
          );
          return {
            id: entry.id,
            type: entry.type,
            isFavorite: entry.isFavorite,
            data: entryData,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          };
        })
      );

      setEntries(decrypted);
    } catch (err) {
      toast.error("Failed to load vault entries");
      console.error(err);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [masterKey, setEntries]);

  useEffect(() => {
    if (isUnlocked && masterKey) {
      loadEntries();
    }
  }, [isUnlocked, masterKey, loadEntries]);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      entry.data.title?.toLowerCase().includes(query) ||
      entry.data.username?.toLowerCase().includes(query) ||
      entry.data.url?.toLowerCase().includes(query) ||
      entry.data.tags?.some((t) => t.toLowerCase().includes(query));

    const matchesCategory =
      activeCategory === "ALL"
        ? true
        : activeCategory === "FAVORITES"
        ? entry.isFavorite
        : entry.type === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Locked state
  if (!isUnlocked) {
    return <VaultUnlock />;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* Left: Category filter */}
      <CategoryFilter />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Search + actions bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} color={C.fgMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              id="vault-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search vault…"
              style={{
                width: "100%",
                padding: "10px 16px 10px 36px",
                borderRadius: 8,
                backgroundColor: C.bgCard,
                border: `1px solid ${focused ? C.primary : C.border}`,
                color: C.fg,
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
                boxShadow: focused ? `0 0 0 2px ${C.ring}` : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            />
          </div>
          <button
            id="add-entry-btn"
            onClick={() => setShowAddModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
              borderRadius: 8, backgroundColor: C.primary, color: "#fff",
              fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
              whiteSpace: "nowrap", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={16} />
            Add item
          </button>
        </div>

        {/* Entries */}
        {isLoadingEntries ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Loader2 size={32} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ fontSize: 14, color: C.fgMuted }}>Decrypting vault…</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center" }}
            >
              {entries.length === 0 ? (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Lock size={32} color={C.fgMuted} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: C.fg, marginBottom: 4 }}>Your vault is empty</h3>
                  <p style={{ fontSize: 14, color: C.fgMuted, marginBottom: 16 }}>
                    Add your first password, note, or card
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px",
                      borderRadius: 8, backgroundColor: C.primary, color: "#fff",
                      fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                      transition: "opacity 0.15s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <Plus size={16} />
                    Add first item
                  </button>
                </>
              ) : (
                <>
                  <Search size={40} color={C.fgMuted} style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: C.fgMuted }}>No results for &quot;{searchQuery}&quot;</p>
                </>
              )}
            </motion.div>
          </div>
        ) : (
          <EntryList entries={filteredEntries} onRefresh={loadEntries} />
        )}
      </div>

      {/* Add entry modal */}
      <AnimatePresence>
        {showAddModal && (
          <EntryModal
            mode="create"
            onClose={() => setShowAddModal(false)}
            onSave={loadEntries}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
