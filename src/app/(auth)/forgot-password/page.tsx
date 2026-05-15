"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

const C = {
  bg: "#09090f", bgCard: "#111120", fg: "#f0eeff",
  fgMuted: "#9c99bc", border: "#282840", input: "#1a1a2e",
  primary: "#7c3aed", error: "#ef4444",
  errorBg: "rgba(239,68,68,0.1)", errorBorder: "rgba(239,68,68,0.2)",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address"); return; }
    setIsLoading(true);
    setError(null);
    try {
      await (authClient as any).requestPasswordReset({ email, redirectTo: "/reset-password" });
      setSent(true);
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="p-6 md:p-8" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Forgot your password?</h1>
          <p style={{ fontSize: 14, color: C.fgMuted }}>Enter your email and we'll send you a reset link.</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, backgroundColor: C.errorBg, border: `1px solid ${C.errorBorder}`, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.error }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {sent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={26} color="#10b981" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Check your inbox</p>
            <p style={{ fontSize: 13, color: C.fgMuted, lineHeight: 1.6 }}>
              If an account exists for <strong style={{ color: C.fg }}>{email}</strong>, a password reset link has been sent. Check your spam folder if you don't see it.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="reset-email" style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.fgMuted, pointerEvents: "none" }} />
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={{
                    width: "100%", padding: "10px 16px 10px 38px", borderRadius: 8,
                    backgroundColor: C.input, border: `1px solid ${focused ? C.primary : C.border}`,
                    color: C.fg, fontSize: 14, outline: "none", fontFamily: "inherit",
                    boxShadow: focused ? "0 0 0 2px rgba(124,58,237,0.2)" : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              style={{ width: "100%", padding: "12px 0", borderRadius: 8, backgroundColor: C.primary, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", opacity: isLoading ? 0.7 : 1, transition: "opacity 0.15s" }}>
              {isLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending…</> : "Send reset link"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 14, color: C.fgMuted, marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <ArrowLeft size={13} />
          <Link href="/login" style={{ color: C.primary, fontWeight: 500, textDecoration: "none" }}>Back to sign in</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
