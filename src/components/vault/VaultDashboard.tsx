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
import { decryptVaultEntry } from "@/lib/crypto/vault";
import type { DecryptedEntry } from "@/store/vaultStore";
import type { EntryType } from "@/lib/crypto/vault";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function VaultDashboard() {
  const {
    isUnlocked,
    masterKey,
    entries,
    searchQuery,
    activeCategory,
    setSearchQuery,
    setEntries,
  } = useVaultStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

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
    <div className="flex flex-col md:flex-row gap-6 h-full p-4 md:p-0">
      {/* Left: Category filter */}
      <CategoryFilter />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Card className="flex-1 flex flex-col border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border/30 bg-muted/20">
            {/* Search + actions bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 relative group">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary" />
                <Input
                  id="vault-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vault…"
                  className="pl-9 bg-background/50 border-border/50 transition-all focus:bg-background"
                />
              </div>
              <Button
                id="add-entry-btn"
                onClick={() => setShowAddModal(true)}
                className="shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add item
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto relative min-h-[400px]">
            {/* Entries */}
            {isLoadingEntries ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Decrypting secure vault…</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center max-w-sm"
                >
                  {entries.length === 0 ? (
                    <div className="space-y-6">
                      <div className="w-20 h-20 rounded-3xl bg-muted/30 border border-border flex items-center justify-center mx-auto shadow-inner">
                        <Lock className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold tracking-tight">Your vault is empty</h3>
                        <p className="text-sm text-muted-foreground">
                          Securely store your passwords, secure notes, and payment cards in your zero-knowledge vault.
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowAddModal(true)}
                        size="lg"
                        className="px-8 shadow-xl shadow-primary/20"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add first item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? (
                          <>No results found for <span className="text-foreground font-medium">&quot;{searchQuery}&quot;</span></>
                        ) : (
                          <>No items found in <span className="text-foreground font-medium">
                            {activeCategory === "ALL" ? "your vault" : 
                             activeCategory === "FAVORITES" ? "Favorites" : 
                             activeCategory === "IDENTITY" ? "Identities" :
                             activeCategory.toLowerCase() + "s"}
                          </span></>
                        )}
                      </p>
                      {searchQuery && (
                        <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                          Clear search
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            ) : (
              <EntryList entries={filteredEntries} onRefresh={loadEntries} />
            )}
          </div>
        </Card>
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
    </div>
  );
}
