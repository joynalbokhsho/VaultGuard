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
} from "lucide-react";
import { toast } from "sonner";
import { useCopyWithClear } from "@/hooks/useCopyWithClear";
import { useVaultStore, type DecryptedEntry } from "@/store/vaultStore";
import { EntryModal } from "./EntryModal";

const typeIcons: Record<string, React.ElementType> = {
  CREDENTIAL: Globe,
  NOTE: FileText,
  CARD: CreditCard,
  API_KEY: KeyRound,
  SSH_KEY: Terminal,
  IDENTITY: User,
};

const typeColors: Record<string, { fg: string; bg: string }> = {
  CREDENTIAL: { fg: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  NOTE: { fg: "#10b981", bg: "rgba(16,185,129,0.1)" },
  CARD: { fg: "#ec4899", bg: "rgba(236,72,153,0.1)" },
  API_KEY: { fg: "#f97316", bg: "rgba(249,115,22,0.1)" },
  SSH_KEY: { fg: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  IDENTITY: { fg: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
};

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  ring: "rgba(124,58,237,0.3)",
  accent: "rgba(255,255,255,0.06)",
  destructive: "#ef4444",
  destructiveBg: "rgba(239,68,68,0.1)",
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
  const [isHovered, setIsHovered] = useState(false);

  const Icon = typeIcons[entry.type] ?? Globe;
  const colors = typeColors[entry.type] ?? typeColors.CREDENTIAL;

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
          encryptedData: "placeholder", // Would re-encrypt in full implementation
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

  const btnStyle = (hoverColor: string, hoverBg: string): React.CSSProperties => ({
    width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
    color: C.fgMuted, background: "transparent", border: "none", cursor: "pointer", transition: "all 0.15s"
  });

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        style={{
          backgroundColor: C.bgCard,
          border: `1px solid ${isHovered ? C.ring : C.border}`,
          borderRadius: 12,
          overflow: "hidden",
          transition: "border-color 0.2s"
        }}
        className="group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main row */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, cursor: "pointer" }}
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Icon */}
          <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: colors.bg, color: colors.fg }}>
            <Icon size={20} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <p style={{ fontWeight: 600, color: C.fg, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {entry.data.title}
              </p>
              {entry.isFavorite && <Star size={14} color="#eab308" fill="#eab308" style={{ flexShrink: 0 }} />}
            </div>
            <p style={{ fontSize: 12, color: C.fgMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {entry.data.username ?? entry.data.url ?? entry.data.service ?? ""}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 sm:gap-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-auto">
            {entry.data.password && (
              <button
                id={`copy-password-${entry.id}`}
                onClick={(e) => { e.stopPropagation(); copy(entry.data.password!, "Password"); }}
                style={btnStyle(C.fg, C.accent)}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.fg; e.currentTarget.style.backgroundColor = C.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.fgMuted; e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Copy password"
              >
                {isCopied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              </button>
            )}
            {entry.data.url && (
              <a
                href={entry.data.url} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ ...btnStyle(C.fg, C.accent), textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.fg; e.currentTarget.style.backgroundColor = C.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.fgMuted; e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Open URL"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
              style={btnStyle("#eab308", "rgba(234,179,8,0.1)")}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#eab308"; e.currentTarget.style.backgroundColor = "rgba(234,179,8,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = entry.isFavorite ? "#eab308" : C.fgMuted; e.currentTarget.style.backgroundColor = "transparent"; }}
              title={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star size={16} color={entry.isFavorite ? "#eab308" : "inherit"} fill={entry.isFavorite ? "#eab308" : "none"} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
              style={btnStyle(C.fg, C.accent)}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.fg; e.currentTarget.style.backgroundColor = C.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.fgMuted; e.currentTarget.style.backgroundColor = "transparent"; }}
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              style={btnStyle(C.destructive, C.destructiveBg)}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.destructive; e.currentTarget.style.backgroundColor = C.destructiveBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.fgMuted; e.currentTarget.style.backgroundColor = "transparent"; }}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ borderTop: `1px solid ${C.border}`, overflow: "hidden" }}
            >
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {entry.data.username && (
                  <DetailRow label="Username" value={entry.data.username} copyable onCopy={() => copy(entry.data.username!, "Username")} />
                )}
                {entry.data.password && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-16">
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.fgMuted, flexShrink: 0 }}>Password</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontFamily: "monospace", color: C.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {showPassword ? entry.data.password : "•".repeat(Math.min(entry.data.password.length, 16))}
                      </span>
                      <button onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", display: "flex", padding: 0 }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => copy(entry.data.password!, "Password")} style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", display: "flex", padding: 0 }}>
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {entry.data.url && <DetailRow label="URL" value={entry.data.url} />}
                {entry.data.content && <DetailRow label="Note" value={entry.data.content} />}
                {entry.data.apiKey && (
                  <DetailRow label="API Key" value={entry.data.apiKey} copyable secret onCopy={() => copy(entry.data.apiKey!, "API Key")} />
                )}
                {entry.data.notes && <DetailRow label="Notes" value={entry.data.notes} />}
                {entry.data.tags && entry.data.tags.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    {entry.data.tags.map((tag) => (
                      <span key={tag} style={{ padding: "4px 10px", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", fontSize: 12, color: C.fgMuted }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-16">
      <span style={{ fontSize: 12, fontWeight: 500, color: C.fgMuted, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 14, color: C.fg, fontFamily: secret ? "monospace" : "inherit", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {secret && !show ? "•".repeat(8) : value}
        </span>
        {secret && (
          <button onClick={() => setShow(!show)} style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", display: "flex", padding: 0 }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {copyable && onCopy && (
          <button onClick={onCopy} style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", display: "flex", padding: 0 }}>
            <Copy size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export function EntryList({ entries, onRefresh }: EntryListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto", paddingRight: 4 }}>
      <AnimatePresence mode="popLayout">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onRefresh={onRefresh} />
        ))}
      </AnimatePresence>
    </div>
  );
}
