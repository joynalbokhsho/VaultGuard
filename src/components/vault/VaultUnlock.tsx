"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useVaultStore } from "@/store/vaultStore";
import { deriveMasterKey } from "@/lib/crypto/keyDerivation";
import { verifyMasterKey } from "@/lib/crypto/vault";

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  input: "#1a1a2e",
  primary: "#7c3aed",
  error: "#ef4444",
  errorBg: "rgba(239,68,68,0.1)",
  errorBorder: "rgba(239,68,68,0.2)",
};

export function VaultUnlock() {
  const { setMasterKey, setUnlocking, isUnlocking } = useVaultStore();
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword.trim()) return;

    setUnlocking(true);
    setError(null);

    try {
      // Step 1: Fetch vault salt + encrypted verifier from server
      const res = await fetch("/api/vault");
      if (!res.ok) throw new Error("Failed to fetch vault");
      const { vault, kdfSalt } = await res.json();

      if (!vault || !kdfSalt) {
        setError("Vault not found. Please contact support.");
        return;
      }

      // Step 2: Derive encryption key from master password (CLIENT-SIDE)
      const masterKey = await deriveMasterKey(masterPassword, kdfSalt);

      // Step 3: Verify the key by attempting to decrypt the vault
      // (If master password is wrong, AES-GCM decryption will throw)
      const isValid = await verifyMasterKey(
        `${vault.iv}:${vault.encryptedData}`,
        masterKey
      );

      if (!isValid) {
        setError("Incorrect master password. Please try again.");
        return;
      }

      // Step 4: Store key in memory (NOT persisted anywhere)
      setMasterKey(masterKey);
      toast.success("Vault unlocked");
    } catch (err) {
      // AES-GCM throws DOMException when decryption fails (wrong key)
      if (err instanceof DOMException) {
        setError("Incorrect master password. Please try again.");
      } else {
        setError("Failed to unlock vault. Please try again.");
        console.error(err);
      }
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ width: "100%", maxWidth: 384 }}
      >
        <div style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
          {/* Lock icon */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}
          >
            <Lock size={32} color={C.primary} />
          </motion.div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.fg, marginBottom: 4 }}>
            Unlock your vault
          </h2>
          <p style={{ fontSize: 14, color: C.fgMuted, marginBottom: 24 }}>
            Enter your master password to decrypt your vault
          </p>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 16, padding: 12, borderRadius: 8, backgroundColor: C.errorBg, border: `1px solid ${C.errorBorder}`, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.error, textAlign: "left" }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <input
                id="master-password-input"
                type={showPassword ? "text" : "password"}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Master password"
                autoFocus
                autoComplete="off"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  width: "100%", padding: "12px 44px 12px 16px", borderRadius: 8, backgroundColor: C.input, border: `1px solid ${focused ? C.primary : C.border}`, color: C.fg, fontSize: 14, fontFamily: "monospace", outline: "none", transition: "border-color 0.15s", boxShadow: focused ? `0 0 0 2px rgba(124,58,237,0.2)` : "none"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.fgMuted, cursor: "pointer", display: "flex", padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              id="vault-unlock-btn"
              type="submit"
              disabled={isUnlocking || !masterPassword}
              style={{
                width: "100%", padding: 12, borderRadius: 8, backgroundColor: C.primary, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: (isUnlocking || !masterPassword) ? "not-allowed" : "pointer", opacity: (isUnlocking || !masterPassword) ? 0.5 : 1, transition: "opacity 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              {isUnlocking ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Decrypting vault…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Unlock vault
                </>
              )}
            </button>
          </form>

          <p style={{ fontSize: 12, color: C.fgMuted, marginTop: 16 }}>
            Your master password never leaves this device
          </p>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
