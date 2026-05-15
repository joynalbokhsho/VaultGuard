"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  FileText,
  CreditCard,
  KeyRound,
  Terminal,
  User,
  Star,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useCopyWithClear } from "@/hooks/useCopyWithClear";
import { useVaultStore, type DecryptedEntry } from "@/store/vaultStore";
import { EntryModal } from "./EntryModal";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  CREDENTIAL: Globe,
  NOTE: FileText,
  CARD: CreditCard,
  API_KEY: KeyRound,
  SSH_KEY: Terminal,
  IDENTITY: User,
};

const typeColors: Record<string, string> = {
  CREDENTIAL: "text-blue-500 bg-blue-500/10",
  NOTE: "text-emerald-500 bg-emerald-500/10",
  CARD: "text-pink-500 bg-pink-500/10",
  API_KEY: "text-orange-500 bg-orange-500/10",
  SSH_KEY: "text-purple-500 bg-purple-500/10",
  IDENTITY: "text-cyan-500 bg-cyan-500/10",
};

interface EntryListProps {
  entries: DecryptedEntry[];
  onRefresh: () => void;
}

function EntryCard({
  entry,
  onRefresh,
}: {
  entry: DecryptedEntry;
  onRefresh: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { copy, isCopied } = useCopyWithClear();
  const { removeEntry, updateEntry } = useVaultStore();

  const Icon = typeIcons[entry.type] ?? Globe;
  const colorClass = typeColors[entry.type] ?? typeColors.CREDENTIAL;

  const handleDelete = async () => {
    if (!confirm(`Delete "${entry.data.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      removeEntry(entry.id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedData: "placeholder",
          iv: "placeholder",
          isFavorite: !entry.isFavorite,
        }),
      });
      if (res.ok) {
        updateEntry(entry.id, { isFavorite: !entry.isFavorite });
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <>
      <Card 
        className={cn(
          "group border-border/40 hover:border-border transition-all duration-200 bg-card/40 backdrop-blur-sm overflow-hidden",
          showDetails && "border-border shadow-md"
        )}
      >
        <div
          className="flex items-center gap-4 p-3 sm:p-4 cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Icon */}
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm truncate max-w-[200px]">
                {entry.data.title}
              </span>
              {entry.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[240px]">
              {entry.data.username ?? entry.data.url ?? entry.data.service ?? ""}
            </p>
          </div>

          {/* Quick Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {entry.data.password && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => { e.stopPropagation(); copy(entry.data.password!, "Password"); }}
                className="hover:text-primary"
              >
                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
            {entry.data.url && (
              <a 
                href={entry.data.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e) => e.stopPropagation()}
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
              className={cn(entry.isFavorite ? "text-yellow-500" : "text-muted-foreground")}
            >
              <Star className={cn("w-4 h-4", entry.isFavorite && "fill-yellow-500")} />
            </Button>
          </div>

          {/* Menu (Mobile & Tablet) */}
          <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "ml-auto")}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showDetails ? "Hide details" : "View details"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleFavorite}>
                <Star className={cn("w-4 h-4 mr-2", entry.isFavorite && "fill-yellow-500 text-yellow-500")} />
                {entry.isFavorite ? "Remove favorite" : "Add to favorite"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit entry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Details Section */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/50 bg-muted/20 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {entry.data.username && (
                  <DetailRow label="Username" value={entry.data.username} copyable onCopy={() => copy(entry.data.username!, "Username")} />
                )}
                {entry.data.password && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Password</span>
                    <div className="flex items-center gap-2 min-w-0 bg-background/50 px-2 py-1.5 rounded-md border border-border/30">
                      <span className="text-sm font-mono truncate">
                        {showPassword ? entry.data.password : "•".repeat(Math.min(entry.data.password.length, 12))}
                      </span>
                      <div className="flex items-center gap-1 ml-auto shrink-0">
                        <Button variant="ghost" size="icon-xs" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => copy(entry.data.password!, "Password")}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {entry.data.url && (
                  <DetailRow label="URL" value={entry.data.url} />
                )}
                {entry.data.content && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Note Content</span>
                    <div className="p-3 rounded-md bg-background/50 border border-border/30 text-sm leading-relaxed whitespace-pre-wrap">
                      {entry.data.content}
                    </div>
                  </div>
                )}
                {entry.data.tags && entry.data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {entry.data.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] py-0 h-5 bg-background/50 border-border/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <AnimatePresence>
        {showEditModal && (
          <EntryModal
            mode="edit"
            entry={entry}
            onClose={() => setShowEditModal(false)}
            onSave={onRefresh}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function DetailRow({
  label, value, copyable, secret, onCopy,
}: {
  label: string; value: string; copyable?: boolean; secret?: boolean; onCopy?: () => void;
}) {
  const [show, setShow] = useState(!secret);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          "text-sm truncate",
          secret ? "font-mono" : "text-foreground/90"
        )}>
          {secret && !show ? "•".repeat(8) : value}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {secret && (
            <Button variant="ghost" size="icon-xs" onClick={() => setShow(!show)}>
              {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
          )}
          {copyable && onCopy && (
            <Button variant="ghost" size="icon-xs" onClick={onCopy}>
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EntryList({ entries, onRefresh }: EntryListProps) {
  return (
    <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 scrollbar-thin">
      <AnimatePresence mode="popLayout">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <EntryCard entry={entry} onRefresh={onRefresh} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
