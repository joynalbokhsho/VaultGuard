"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, Fingerprint, Lock } from "lucide-react";
import { toast } from "sonner";
import { signIn, authClient } from "@/lib/auth/auth-client";
import { loginSchema, type LoginInput } from "@/lib/validations/schemas";

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
};

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await (signIn as any).email({ email: data.email, password: data.password, callbackURL: "/vault" });
      if (result.error) { setError(result.error.message ?? "Invalid email or password"); return; }
      
      if (result.data?.twoFactorRedirect) {
        setRequiresTwoFactor(true);
        return;
      }

      toast.success("Welcome back!");
      router.push("/vault");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) {
      setError("Code must be 6 digits");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await (authClient as any).twoFactor.verifyTotp({ code: totpCode });
      if (result.error) {
        setError(result.error.message ?? "Invalid verification code");
        return;
      }
      toast.success("Welcome back!");
      router.push("/vault");
      router.refresh();
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (id: string): React.CSSProperties => ({
    width: "100%",
    padding: "10px 16px",
    borderRadius: 8,
    backgroundColor: C.input,
    border: `1px solid ${focused === id ? C.primary : C.border}`,
    color: C.fg,
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxShadow: focused === id ? `0 0 0 2px rgba(124,58,237,0.2)` : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  });

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Card */}
      <div className="p-6 md:p-8" style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: C.fgMuted }}>Sign in to access your encrypted vault</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ marginBottom: 24, padding: "10px 14px", borderRadius: 8, backgroundColor: C.errorBg, border: `1px solid ${C.errorBorder}`, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.error }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!requiresTwoFactor ? (
            <motion.form key="login" onSubmit={handleSubmit(onSubmit)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, position: "absolute", width: "100%" }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Email */}
              <div>
                <label htmlFor="login-email" style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>
                  Email address
                </label>
                <input id="login-email" type="email" autoComplete="email" placeholder="you@example.com"
                  onFocus={() => setFocused("email")}
                  style={inputStyle("email")} {...register("email", { onBlur: () => setFocused(null) })} />
                {errors.email && <p style={{ fontSize: 12, color: C.error, marginTop: 4 }}>{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label htmlFor="login-password" style={{ fontSize: 14, fontWeight: 500, color: C.fg }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: C.primary, textDecoration: "none" }}>Forgot password?</Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                    placeholder="Enter your password" onFocus={() => setFocused("password")}
                    style={{ ...inputStyle("password"), paddingRight: 44 }} {...register("password", { onBlur: () => setFocused(null) })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password"
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.fgMuted, display: "flex", padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: 12, color: C.error, marginTop: 4 }}>{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button id="login-submit" type="submit" disabled={isLoading}
                style={{ width: "100%", padding: "12px 0", borderRadius: 8, backgroundColor: isLoading ? C.primaryHover : C.primary, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", opacity: isLoading ? 0.7 : 1, transition: "opacity 0.15s" }}>
                {isLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Signing in…</> : "Sign in"}
              </button>
            </motion.form>
          ) : (
            <motion.form key="2fa" onSubmit={onVerifyTwoFactor} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <p style={{ fontSize: 14, color: C.fgMuted }}>
                  Enter the 6-digit code from your authenticator app to continue.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  autoFocus
                  onFocus={() => setFocused("totp")}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 8, backgroundColor: C.input,
                    border: `1px solid ${focused === "totp" ? C.primary : C.border}`, color: C.fg, textAlign: "center",
                    fontSize: 24, fontFamily: "monospace", letterSpacing: "1rem", outline: "none",
                    boxShadow: focused === "totp" ? `0 0 0 2px ${C.primaryHover}40` : "none", transition: "all 0.15s"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setRequiresTwoFactor(false)}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 8, backgroundColor: "transparent", color: C.fgMuted, fontWeight: 600, fontSize: 14, border: `1px solid ${C.border}`, cursor: isLoading ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || totpCode.length !== 6}
                  style={{ flex: 2, padding: "12px 0", borderRadius: 8, backgroundColor: C.primary, color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: (isLoading || totpCode.length !== 6) ? "not-allowed" : "pointer", opacity: (isLoading || totpCode.length !== 6) ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.15s" }}
                >
                  {isLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  Verify
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
          <span style={{ padding: "0 12px", fontSize: 12, color: C.fgMuted }}>OR</span>
          <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        </div>

        <button
          onClick={async () => {
            setIsLoading(true);
            try {
              const result = await signIn.passkey();
              if (result?.error) {
                setError(result.error.message ?? "Passkey login failed");
              } else {
                toast.success("Welcome back!");
                router.push("/vault");
                router.refresh();
              }
            } catch (err) {
              setError("Passkey login failed. Please try again.");
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          style={{ width: "100%", padding: "12px 0", borderRadius: 8, backgroundColor: "transparent", color: C.fg, fontWeight: 600, fontSize: 14, border: `1px solid ${C.border}`, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", transition: "background-color 0.15s" }}
        >
          <Fingerprint size={16} /> Sign in with Passkey
        </button>

        <p style={{ textAlign: "center", fontSize: 14, color: C.fgMuted, marginTop: 24 }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: C.primary, fontWeight: 500, textDecoration: "none" }}>Create one free</Link>
        </p>
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Lock size={12} /> End-to-end encrypted · Your master password never leaves your device
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
