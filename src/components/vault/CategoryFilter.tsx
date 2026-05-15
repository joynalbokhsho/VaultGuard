"use client";

import { useVaultStore } from "@/store/vaultStore";
import type { EntryType } from "@/lib/crypto/vault";
import {
  Globe,
  FileText,
  CreditCard,
  KeyRound,
  Terminal,
  User,
  Star,
  LayoutGrid,
} from "lucide-react";

const C = {
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  primary: "#7c3aed",
  primaryHover: "#6d28d9",
  hoverBg: "rgba(255,255,255,0.06)",
  activeBg: "rgba(124,58,237,0.1)",
  badgeBg: "rgba(255,255,255,0.1)",
  badgeActiveBg: "rgba(124,58,237,0.2)",
};

const categories: { value: EntryType | "ALL" | "FAVORITES"; label: string; icon: typeof Globe; color: string }[] = [
  { value: "ALL", label: "All items", icon: LayoutGrid, color: C.fg },
  { value: "FAVORITES", label: "Favorites", icon: Star, color: "#eab308" },
  { value: "CREDENTIAL", label: "Passwords", icon: Globe, color: "#3b82f6" },
  { value: "NOTE", label: "Notes", icon: FileText, color: "#10b981" },
  { value: "CARD", label: "Cards", icon: CreditCard, color: "#ec4899" },
  { value: "API_KEY", label: "API Keys", icon: KeyRound, color: "#f97316" },
  { value: "SSH_KEY", label: "SSH Keys", icon: Terminal, color: "#8b5cf6" },
  { value: "IDENTITY", label: "Identities", icon: User, color: "#06b6d4" },
];

export function CategoryFilter() {
  const { activeCategory, setActiveCategory, entries } = useVaultStore();

  const getCategoryCount = (cat: typeof categories[0]["value"]) => {
    if (cat === "ALL") return entries.length;
    if (cat === "FAVORITES") return entries.filter((e) => e.isFavorite).length;
    return entries.filter((e) => e.type === cat).length;
  };

  return (
    <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
      <p style={{
        fontSize: 12, fontWeight: 600, color: C.fgMuted,
        textTransform: "uppercase", letterSpacing: "0.1em",
        padding: "0 12px", marginBottom: 12
      }}>
        Categories
      </p>
      {categories.map((cat) => {
        const count = getCategoryCount(cat.value);
        const isActive = activeCategory === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8, fontSize: 14,
              backgroundColor: isActive ? C.activeBg : "transparent",
              color: isActive ? C.primary : C.fgMuted,
              border: "none", cursor: "pointer", textAlign: "left",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = C.hoverBg;
                e.currentTarget.style.color = C.fg;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = C.fgMuted;
              }
            }}
          >
            <cat.icon size={16} color={isActive ? C.primary : cat.color} />
            <span style={{ flex: 1, fontWeight: isActive ? 600 : 500 }}>{cat.label}</span>
            {count > 0 && (
              <span style={{
                fontSize: 12, padding: "2px 8px", borderRadius: 999,
                backgroundColor: isActive ? C.badgeActiveBg : C.badgeBg,
                color: isActive ? C.primary : C.fgMuted,
                fontWeight: 600
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
