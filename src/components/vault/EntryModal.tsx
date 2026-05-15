"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { z } from "zod";
import { X, Loader2, Globe, FileText, CreditCard, KeyRound, Terminal, User } from "lucide-react";
import { toast } from "sonner";
import { useVaultStore, type DecryptedEntry } from "@/store/vaultStore";
import { encryptVaultEntry } from "@/lib/crypto/vault";
import type { EntryType, VaultEntryData } from "@/lib/crypto/vault";

const entrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["CREDENTIAL", "NOTE", "CARD", "API_KEY", "SSH_KEY", "IDENTITY"]),
  username: z.string().optional(),
  password: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  content: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  service: z.string().optional(),
  privateKey: z.string().optional(),
  publicKey: z.string().optional(),
  passphrase: z.string().optional(),
  hostname: z.string().optional(),
  cardNumber: z.string().optional(),
  cardholderName: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.string().optional(), // comma-separated
});

type EntryFormData = z.infer<typeof entrySchema>;

const typeConfig = [
  { value: "CREDENTIAL" as EntryType, label: "Password", icon: Globe },
  { value: "NOTE" as EntryType, label: "Secure Note", icon: FileText },
  { value: "CARD" as EntryType, label: "Card", icon: CreditCard },
  { value: "API_KEY" as EntryType, label: "API Key", icon: KeyRound },
  { value: "SSH_KEY" as EntryType, label: "SSH Key", icon: Terminal },
  { value: "IDENTITY" as EntryType, label: "Identity", icon: User },
];

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  input: "#1a1a2e",
  primary: "#7c3aed",
  primaryHover: "#6d28d9",
  ring: "rgba(124,58,237,0.3)",
  accent: "rgba(255,255,255,0.06)",
  destructive: "#ef4444",
};

interface EntryModalProps {
  mode: "create" | "edit";
  entry?: DecryptedEntry;
  onClose: () => void;
  onSave: () => void;
}

export function EntryModal({ mode, entry, onClose, onSave }: EntryModalProps) {
  const { masterKey, addEntry } = useVaultStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<EntryType>(
    entry?.type ?? "CREDENTIAL"
  );

  const { register, handleSubmit, formState: { errors } } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      type: entry?.type ?? "CREDENTIAL",
      title: entry?.data.title ?? "",
      username: entry?.data.username ?? "",
      password: entry?.data.password ?? "",
      url: entry?.data.url ?? "",
      notes: entry?.data.notes ?? "",
      content: entry?.data.content ?? "",
      apiKey: entry?.data.apiKey ?? "",
      service: entry?.data.service ?? "",
      privateKey: entry?.data.privateKey ?? "",
      publicKey: entry?.data.publicKey ?? "",
      hostname: entry?.data.hostname ?? "",
      cardNumber: entry?.data.cardNumber ?? "",
      cardholderName: entry?.data.cardholderName ?? "",
      isFavorite: entry?.isFavorite ?? false,
      tags: entry?.data.tags?.join(", ") ?? "",
    },
  });

  const onSubmit = async (data: EntryFormData) => {
    if (!masterKey) {
      toast.error("Vault is locked");
      return;
    }

    setIsLoading(true);
    try {
      const entryData: VaultEntryData = {
        title: data.title,
        notes: data.notes,
        tags: data.tags?.split(",").map((t) => t.trim()).filter(Boolean),
        createdAt: entry?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        username: data.username,
        password: data.password,
        url: data.url,
        content: data.content,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        service: data.service,
        privateKey: data.privateKey,
        publicKey: data.publicKey,
        passphrase: data.passphrase,
        hostname: data.hostname,
        cardNumber: data.cardNumber,
        cardholderName: data.cardholderName,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvv: data.cvv,
      };

      // Encrypt client-side before sending
      const { encryptedData, iv } = await encryptVaultEntry(entryData, masterKey);

      const url = mode === "edit" ? `/api/entries/${entry!.id}` : "/api/entries";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedData,
          iv,
          type: selectedType,
          isFavorite: data.isFavorite ?? false,
        }),
      });

      if (!res.ok) throw new Error("Failed to save entry");

      toast.success(mode === "create" ? "Entry added to vault" : "Entry updated");
      onSave();
      onClose();
    } catch (err) {
      toast.error("Failed to save entry");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: C.input, border: `1px solid ${C.border}`,
    color: C.fg, fontSize: 14, outline: "none", transition: "border-color 0.15s", fontFamily: "inherit"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 512, backgroundColor: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontWeight: 600, color: C.fg, fontSize: 16 }}>
            {mode === "create" ? "Add new item" : "Edit item"}
          </h2>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: C.fgMuted, background: "none", border: "none", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.fg; e.currentTarget.style.backgroundColor = C.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.fgMuted; e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ overflow: "auto", flex: 1, padding: 24 }}>
          <form id="entry-form" onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Type selector */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.fgMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                Item type
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {typeConfig.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12, borderRadius: 8, fontSize: 12, fontWeight: 500, transition: "all 0.15s", cursor: "pointer",
                      border: `1px solid ${selectedType === type.value ? C.primary : C.border}`,
                      backgroundColor: selectedType === type.value ? "rgba(124,58,237,0.1)" : "transparent",
                      color: selectedType === type.value ? C.primary : C.fgMuted
                    }}
                    onMouseEnter={(e) => { if (selectedType !== type.value) e.currentTarget.style.borderColor = C.ring; }}
                    onMouseLeave={(e) => { if (selectedType !== type.value) e.currentTarget.style.borderColor = C.border; }}
                  >
                    <type.icon size={16} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <Field label="Title" error={errors.title?.message}>
              <input
                id="entry-title"
                type="text"
                {...register("title")}
                placeholder="e.g. Gmail, GitHub, Bank..."
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = C.primary}
                onBlur={(e) => e.target.style.borderColor = C.border}
              />
            </Field>

            {/* Type-specific fields */}
            {selectedType === "CREDENTIAL" && (
              <>
                <Field label="Username / Email">
                  <input id="entry-username" type="text" {...register("username")} placeholder="username@example.com" style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
                <Field label="Password">
                  <input id="entry-password" type="password" {...register("password")} placeholder="Password" style={{ ...inputStyle, fontFamily: "monospace" }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
                <Field label="Website URL">
                  <input id="entry-url" type="url" {...register("url")} placeholder="https://example.com" style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
              </>
            )}

            {selectedType === "NOTE" && (
              <Field label="Content">
                <textarea id="entry-content" {...register("content")} placeholder="Your secure note..." rows={5} style={{ ...inputStyle, resize: "none" }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
              </Field>
            )}

            {selectedType === "CARD" && (
              <>
                <Field label="Card number">
                  <input id="entry-cardnumber" type="text" {...register("cardNumber")} placeholder="1234 5678 9012 3456" style={{ ...inputStyle, fontFamily: "monospace" }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
                <Field label="Cardholder name">
                  <input id="entry-cardholder" type="text" {...register("cardholderName")} placeholder="Full name" style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <Field label="Month">
                    <input type="text" {...register("expiryMonth")} placeholder="MM" style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                  </Field>
                  <Field label="Year">
                    <input type="text" {...register("expiryYear")} placeholder="YY" style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                  </Field>
                  <Field label="CVV">
                    <input type="text" {...register("cvv")} placeholder="123" style={{ ...inputStyle, fontFamily: "monospace" }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                  </Field>
                </div>
              </>
            )}

            {selectedType === "API_KEY" && (
              <>
                <Field label="Service name">
                  <input id="entry-service" type="text" {...register("service")} placeholder="OpenAI, AWS, etc." style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
                <Field label="API Key">
                  <input id="entry-apikey" type="password" {...register("apiKey")} placeholder="sk-..." style={{ ...inputStyle, fontFamily: "monospace" }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
                <Field label="API Secret (optional)">
                  <input type="password" {...register("apiSecret")} placeholder="Secret key" style={{ ...inputStyle, fontFamily: "monospace" }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
              </>
            )}

            {selectedType === "SSH_KEY" && (
              <>
                <Field label="Hostname">
                  <input type="text" {...register("hostname")} placeholder="github.com" style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
                <Field label="Private key">
                  <textarea {...register("privateKey")} placeholder="-----BEGIN RSA PRIVATE KEY-----" rows={5} style={{ ...inputStyle, fontFamily: "monospace", resize: "none", fontSize: 12 }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
                <Field label="Public key">
                  <textarea {...register("publicKey")} placeholder="ssh-rsa AAAA..." rows={3} style={{ ...inputStyle, fontFamily: "monospace", resize: "none", fontSize: 12 }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
                <Field label="Passphrase">
                  <input type="password" {...register("passphrase")} placeholder="Key passphrase" style={{ ...inputStyle, fontFamily: "monospace" }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
                </Field>
              </>
            )}

            {/* Notes & Tags */}
            <Field label="Notes (optional)">
              <textarea {...register("notes")} placeholder="Additional notes..." rows={2} style={{ ...inputStyle, resize: "none" }} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
            </Field>

            <Field label="Tags (optional)">
              <input type="text" {...register("tags")} placeholder="work, personal, bank (comma-separated)" style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.primary} onBlur={(e) => e.target.style.borderColor = C.border} />
            </Field>

            {/* Favorite */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8 }}>
              <input type="checkbox" {...register("isFavorite")} style={{ borderRadius: 4, width: 16, height: 16, accentColor: C.primary }} />
              <span style={{ fontSize: 14, color: C.fg }}>Add to favorites</span>
            </label>
          </form>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 12, padding: "16px 24px", borderTop: `1px solid ${C.border}` }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.fg, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background-color 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.accent}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Cancel
          </button>
          <button
            id="entry-save-btn"
            type="submit"
            form="entry-form"
            disabled={isLoading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, backgroundColor: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, border: "none", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.5 : 1, transition: "opacity 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.opacity = "1"; }}
          >
            {isLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {isLoading ? "Encrypting…" : mode === "create" ? "Add to vault" : "Save changes"}
          </button>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ marginTop: 4, fontSize: 12, color: C.destructive }}>{error}</p>}
    </div>
  );
}
