"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, CheckCircle, Info, Lock } from "lucide-react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth/auth-client";
import { registerSchema, masterPasswordSchema } from "@/lib/validations/schemas";
import { generateKdfSalt, deriveMasterKey } from "@/lib/crypto/keyDerivation";
import { encryptVaultMeta, createMasterKeyVerifier } from "@/lib/crypto/vault";

const fullSchema = registerSchema.extend({
  masterPassword: masterPasswordSchema,
  confirmMasterPassword: z.string(),
}).refine((d) => d.masterPassword === d.confirmMasterPassword, {
  message: "Master passwords do not match",
  path: ["confirmMasterPassword"],
});

type FormData = z.infer<typeof fullSchema>;

const C = {
  bg: "#09090f",
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  input: "#1a1a2e",
  primary: "#7c3aed",
  primaryHover: "#6d28d9",
  error: "#ef4444",
  errorBg: "rgba(239,68,68,0.1)",
  errorBorder: "rgba(239,68,68,0.2)",
  infoBg: "rgba(124,58,237,0.08)",
  infoBorder: "rgba(124,58,237,0.25)",
};

const checks = [
  { label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { label: "One uppercase letter",   test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter",   test: (p: string) => /[a-z]/.test(p) },
  { label: "One number",             test: (p: string) => /[0-9]/.test(p) },
];

export function RegisterForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showMaster, setShowMaster] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masterVal, setMasterVal] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signUp.email({ email: data.email, password: data.password, name: data.name ?? data.email.split("@")[0], callbackURL: "/vault" });
      if (result.error) { setError(result.error.message ?? "Registration failed"); return; }

      const kdfSalt = generateKdfSalt();
      const masterKey = await deriveMasterKey(data.masterPassword, kdfSalt);
      await createMasterKeyVerifier(masterKey);
      const { encryptedData, iv } = await encryptVaultMeta({ version: 1, createdAt: new Date().toISOString() }, masterKey);

      const vaultRes = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedData, iv, kdfSalt }),
      });
      if (!vaultRes.ok) throw new Error("Failed to create vault");

      toast.success("Account created! Your vault is ready.");
      router.push("/vault");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (id: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: "100%",
    padding: "10px 16px",
    borderRadius: 8,
    backgroundColor: C.input,
    border: `1px solid ${focused === id ? C.primary : C.border}`,
    color: C.fg,
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxShadow: focused === id ? "0 0 0 2px rgba(124,58,237,0.2)" : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    ...extra,
  });

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="p-6 md:p-8" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Create your vault</h1>
          <p style={{ fontSize: 14, color: C.fgMuted }}>Free forever. End-to-end encrypted.</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, backgroundColor: C.errorBg, border: `1px solid ${C.errorBorder}`, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.error }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>
              Name <span style={{ color: C.fgMuted }}>(optional)</span>
            </label>
            <input id="reg-name" type="text" autoComplete="name" placeholder="Your name"
              onFocus={() => setFocused("name")}
              style={inputStyle("name")} {...register("name", { onBlur: () => setFocused(null) })} />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>Email address</label>
            <input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com"
              onFocus={() => setFocused("email")}
              style={inputStyle("email")} {...register("email", { onBlur: () => setFocused(null) })} />
            {errors.email && <p style={{ fontSize: 12, color: C.error, marginTop: 4 }}>{errors.email.message}</p>}
          </div>

          {/* Login Password */}
          <div>
            <label htmlFor="reg-password" style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>Login password</label>
            <div style={{ position: "relative" }}>
              <input id="reg-password" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="Min. 8 characters"
                onFocus={() => setFocused("password")}
                style={inputStyle("password", { paddingRight: 44 })} {...register("password", { onBlur: () => setFocused(null) })} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.fgMuted, display: "flex", padding: 0 }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: 12, color: C.error, marginTop: 4 }}>{errors.password.message}</p>}
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0" }} />

          {/* Master password info */}
          <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: C.infoBg, border: `1px solid ${C.infoBorder}`, display: "flex", gap: 8, fontSize: 13, color: "#a78bfa" }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              <strong>Master password</strong> is separate from your login password. It encrypts your vault locally — we never see it.{" "}
              <strong>If you lose it, your vault data cannot be recovered.</strong>
            </span>
          </div>

          {/* Master Password */}
          <div>
            <label htmlFor="reg-master" style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>Master password</label>
            <div style={{ position: "relative" }}>
              <input id="reg-master" type={showMaster ? "text" : "password"} autoComplete="off" placeholder="Min. 12 chars, strong passphrase"
                onFocus={() => setFocused("master")}
                style={inputStyle("master", { paddingRight: 44, fontFamily: "monospace" })}
                {...register("masterPassword", { onChange: (e) => setMasterVal(e.target.value), onBlur: () => setFocused(null) })} />
              <button type="button" onClick={() => setShowMaster(!showMaster)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.fgMuted, display: "flex", padding: 0 }}>
                {showMaster ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.masterPassword && <p style={{ fontSize: 12, color: C.error, marginTop: 4 }}>{errors.masterPassword.message}</p>}

            {/* Strength checklist */}
            <AnimatePresence>
              {masterVal.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
                  {checks.map((c) => {
                    const ok = c.test(masterVal);
                    return (
                      <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                        <CheckCircle size={13} color={ok ? "#34d399" : "#3f3f5c"} />
                        <span style={{ color: ok ? C.fg : C.fgMuted }}>{c.label}</span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Confirm Master */}
          <div>
            <label htmlFor="reg-master-confirm" style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>Confirm master password</label>
            <input id="reg-master-confirm" type="password" autoComplete="off" placeholder="Re-enter master password"
              onFocus={() => setFocused("confirm")}
              style={inputStyle("confirm", { fontFamily: "monospace" })} {...register("confirmMasterPassword", { onBlur: () => setFocused(null) })} />
            {errors.confirmMasterPassword && <p style={{ fontSize: 12, color: C.error, marginTop: 4 }}>{errors.confirmMasterPassword.message}</p>}
          </div>

          {/* Submit */}
          <button id="register-submit" type="submit" disabled={isLoading}
            style={{ width: "100%", padding: "12px 0", borderRadius: 8, backgroundColor: C.primary, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", opacity: isLoading ? 0.7 : 1, transition: "opacity 0.15s", marginTop: 4 }}>
            {isLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Creating vault…</> : "Create vault"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 14, color: C.fgMuted, marginTop: 24 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: C.primary, fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Lock size={12} /> Your vault is encrypted before reaching our servers
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
