"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

const C = {
  bg: "#09090f", bgCard: "#111120", fg: "#f0eeff",
  fgMuted: "#9c99bc", border: "#282840", input: "#1a1a2e",
  primary: "#7c3aed", error: "#ef4444",
  errorBg: "rgba(239,68,68,0.1)", errorBorder: "rgba(239,68,68,0.2)",
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Invalid or expired reset link. Please request a new one.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      await (authClient as any).resetPassword({ token, newPassword: password });
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Failed to reset password. The link may have expired. Please request a new one.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (id: string): React.CSSProperties => ({
    width: "100%", padding: "10px 16px", borderRadius: 8,
    backgroundColor: C.input, border: `1px solid ${focused === id ? C.primary : C.border}`,
    color: C.fg, fontSize: 14, outline: "none", fontFamily: "inherit",
    boxShadow: focused === id ? "0 0 0 2px rgba(124,58,237,0.2)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box",
  });

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="p-6 md:p-8" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Set new password</h1>
          <p style={{ fontSize: 14, color: C.fgMuted }}>Choose a strong password for your account.</p>
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

        {done ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={26} color="#10b981" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Password reset!</p>
            <p style={{ fontSize: 13, color: C.fgMuted }}>Redirecting you to sign in…</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* New password */}
            <div>
              <label htmlFor="new-password" style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>New password</label>
              <div style={{ position: "relative" }}>
                <input id="new-password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("pw")} onBlur={() => setFocused(null)}
                  style={{ ...inputStyle("pw"), paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.fgMuted, display: "flex", padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label htmlFor="confirm-password" style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>Confirm password</label>
              <input id="confirm-password" type="password" placeholder="Re-enter new password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
                style={inputStyle("confirm")} />
            </div>

            <button type="submit" disabled={isLoading || !token}
              style={{ width: "100%", padding: "12px 0", borderRadius: 8, backgroundColor: C.primary, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: (isLoading || !token) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", opacity: isLoading || !token ? 0.7 : 1, transition: "opacity 0.15s" }}>
              {isLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Resetting…</> : "Reset password"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 14, color: C.fgMuted, marginTop: 24 }}>
          <Link href="/forgot-password" style={{ color: C.primary, fontWeight: 500, textDecoration: "none" }}>Request a new reset link</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
