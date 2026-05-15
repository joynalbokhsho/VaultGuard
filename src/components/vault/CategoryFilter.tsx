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

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const categories: { value: EntryType | "ALL" | "FAVORITES"; label: string; icon: typeof Globe; color: string }[] = [
  { value: "ALL", label: "All items", icon: LayoutGrid, color: "text-foreground" },
  { value: "FAVORITES", label: "Favorites", icon: Star, color: "text-yellow-500" },
  { value: "CREDENTIAL", label: "Passwords", icon: Globe, color: "text-blue-500" },
  { value: "NOTE", label: "Secure Notes", icon: FileText, color: "text-emerald-500" },
  { value: "CARD", label: "Payment Cards", icon: CreditCard, color: "text-pink-500" },
  { value: "API_KEY", label: "API Keys", icon: KeyRound, color: "text-orange-500" },
  { value: "SSH_KEY", label: "SSH Keys", icon: Terminal, color: "text-purple-500" },
  { value: "IDENTITY", label: "Identities", icon: User, color: "text-cyan-500" },
];

export function CategoryFilter() {
  const { activeCategory, setActiveCategory, entries } = useVaultStore();

  const getCategoryCount = (cat: typeof categories[0]["value"]) => {
    if (cat === "ALL") return entries.length;
    if (cat === "FAVORITES") return entries.filter((e) => e.isFavorite).length;
    return entries.filter((e) => e.type === cat).length;
  };

  return (
    <div className="w-[240px] shrink-0 hidden lg:flex flex-col gap-4">
      <Card className="flex-1 flex flex-col border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden p-3 gap-1">
        <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
          Vault Categories
        </p>
        
        {categories.map((cat) => {
          const count = getCategoryCount(cat.value);
          const isActive = activeCategory === cat.value;
          return (
            <Button
              key={cat.value}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-10 px-3 gap-3 transition-all",
                isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setActiveCategory(cat.value)}
            >
              <cat.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : cat.color)} />
              <span className={cn("flex-1 text-sm truncate", isActive ? "font-semibold" : "font-medium")}>
                {cat.label}
              </span>
              {count > 0 && (
                <Badge 
                  variant={isActive ? "default" : "secondary"} 
                  className={cn(
                    "ml-auto text-[10px] h-5 min-w-[20px] px-1 justify-center rounded-full",
                    isActive ? "bg-primary text-primary-foreground border-0" : "bg-muted text-muted-foreground border-0"
                  )}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </Card>
    </div>
  );
}
