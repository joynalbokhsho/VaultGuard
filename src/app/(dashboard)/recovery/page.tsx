"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LifeBuoy, Copy, RefreshCcw, AlertCircle, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { useCopyWithClear } from "@/hooks/useCopyWithClear";

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#7c3aed",
  warning: "#eab308",
  warningBg: "rgba(234,179,8,0.1)",
  warningBorder: "rgba(234,179,8,0.2)",
  success: "#10b981",
  muted: "rgba(255,255,255,0.03)",
  accent: "rgba(255,255,255,0.06)",
};

export default function RecoveryPage() {
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { copy } = useCopyWithClear({ clearAfterMs: 60_000 });

  const generateCodes = async () => {
    if (generated && !confirm("Generating new codes will invalidate your old ones. Continue?")) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/recovery", { method: "POST" });
      const data = await res.json();
      setCodes(data.codes);
      setGenerated(true);
      toast.success("Recovery codes generated — save them now!");
    } catch {
      toast.error("Failed to generate recovery codes");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCodes = () => {
    const text = `VaultGuard Recovery Codes\n${"=".repeat(30)}\n\nGenerated: ${new Date().toLocaleString()}\n\nRecovery Codes:\n${codes.map((c) => `  ${c}`).join("\n")}\n\n${"=".repeat(30)}\nEach code can only be used once.\nStore this file securely and do not share it.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vaultguard-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 672, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.fg }}>Recovery Center</h1>
        <p style={{ fontSize: 14, color: C.fgMuted, marginTop: 4 }}>
          Manage emergency access and recovery options
        </p>
      </div>

      {/* Recovery codes */}
      <div style={{ borderRadius: 16, backgroundColor: C.bgCard, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 24px", borderBottom: `1px solid ${C.border}`, backgroundColor: C.muted }}>
          <LifeBuoy size={16} color={C.primary} />
          <h2 style={{ fontWeight: 600, color: C.fg, fontSize: 14 }}>Recovery Codes</h2>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: C.fgMuted }}>
            Recovery codes are one-time use codes that let you access your account if you lose access to your authenticator app. Each code can only be used once.
          </p>

          <div style={{ padding: 12, borderRadius: 8, backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}`, display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: C.warning }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Keep these codes somewhere safe. Generating new codes will invalidate all previous codes.
            </span>
          </div>

          <button
            id="generate-recovery-btn"
            onClick={generateCodes}
            disabled={isLoading}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8,
              backgroundColor: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, border: "none",
              cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.5 : 1, transition: "opacity 0.15s",
              alignSelf: "flex-start"
            }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.opacity = "1"; }}
          >
            <RefreshCcw size={16} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
            {generated ? "Regenerate codes" : "Generate recovery codes"}
          </button>

          <AnimatePresence>
            {codes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                  {codes.map((code) => (
                    <div key={code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px", borderRadius: 8, backgroundColor: C.muted, border: `1px solid ${C.border}` }}>
                      <code style={{ flex: 1, fontSize: 14, fontFamily: "monospace", color: C.fg }}>{code}</code>
                      <button
                        onClick={() => copy(code, "Recovery code")}
                        style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", display: "flex", padding: 0 }}
                        onMouseEnter={(e) => e.currentTarget.style.color = C.fg}
                        onMouseLeave={(e) => e.currentTarget.style.color = C.fgMuted}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={downloadCodes}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8,
                      border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.fg, fontSize: 14,
                      fontWeight: 500, cursor: "pointer", transition: "background-color 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.accent}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Download size={16} />
                    Download as text file
                  </button>
                  <button
                    onClick={() => copy(codes.join("\n"), "All recovery codes")}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8,
                      border: `1px solid ${C.border}`, backgroundColor: "transparent", color: C.fg, fontSize: 14,
                      fontWeight: 500, cursor: "pointer", transition: "background-color 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.accent}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <Copy size={16} />
                    Copy all
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.success }}>
                  <CheckCircle size={14} />
                  8 codes generated — save them before leaving this page
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
