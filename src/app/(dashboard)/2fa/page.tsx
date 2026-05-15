"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Smartphone, CheckCircle, Copy, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { useCopyWithClear } from "@/hooks/useCopyWithClear";

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#7c3aed",
  primaryBg: "rgba(124,58,237,0.1)",
  destructive: "#ef4444",
  destructiveBg: "rgba(239,68,68,0.1)",
  destructiveBorder: "rgba(239,68,68,0.2)",
  success: "#10b981",
  successBg: "rgba(16,185,129,0.1)",
  muted: "rgba(255,255,255,0.03)",
  input: "#1a1a2e",
  ring: "rgba(124,58,237,0.3)",
};

function PasswordModal({
  action,
  onClose,
  onSubmit,
  isLoading,
  passwordInput,
  setPasswordInput,
}: {
  action: "enable" | "disable" | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
  isLoading: boolean;
  passwordInput: string;
  setPasswordInput: (pw: string) => void;
}) {
  return (
    <AnimatePresence>
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              width: "100%", maxWidth: 400, backgroundColor: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)"
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.fg, marginBottom: 8 }}>Authentication Required</h3>
            <p style={{ fontSize: 14, color: C.fgMuted, marginBottom: 16 }}>
              Please enter your <strong>Login Password</strong> (not your Master Password) to {action} 2FA.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(passwordInput); }}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Your password"
                autoFocus
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8, backgroundColor: C.input,
                  border: `1px solid ${C.border}`, color: C.fg, marginBottom: 20, outline: "none", transition: "border-color 0.15s"
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
              
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => { onClose(); setPasswordInput(""); }}
                  style={{
                    padding: "8px 16px", borderRadius: 8, backgroundColor: "transparent", color: C.fgMuted,
                    border: "none", cursor: "pointer", fontWeight: 500, transition: "color 0.15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.fg)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.fgMuted)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!passwordInput || isLoading}
                  style={{
                    padding: "8px 16px", borderRadius: 8, backgroundColor: action === "disable" ? C.destructive : C.primary, color: "#fff",
                    border: "none", cursor: (!passwordInput || isLoading) ? "not-allowed" : "pointer",
                    fontWeight: 500, opacity: (!passwordInput || isLoading) ? 0.5 : 1, transition: "opacity 0.15s"
                  }}
                >
                  {isLoading ? "Verifying..." : "Continue"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TwoFactorPage() {
  const { data: session } = authClient.useSession();
  const [step, setStep] = useState<"setup" | "verify" | "done">("setup");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [passwordModalAction, setPasswordModalAction] = useState<"enable" | "disable" | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const { copy } = useCopyWithClear();

  const is2FAEnabled = session?.user?.twoFactorEnabled ?? false;

  const startSetup = async (password: string) => {
    if (!password) {
      toast.error("Password is required to enable 2FA");
      return;
    }
    setIsLoading(true);
    setPasswordModalAction(null);
    try {
      const result = await (authClient as any).twoFactor.enable({
        password,
      });
      if (result.error) throw new Error(result.error.message);
      
      const uri = result.data?.totpURI ?? "";
      setQrCode(uri);
      
      // Extract secret from URI for manual entry
      const secretMatch = uri.match(/secret=([^&]+)/);
      setSecret(secretMatch ? secretMatch[1] : "");
      
      // Store backup codes locally until verified
      if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
      }
      
      setStep("verify");
    } catch (err: any) {
      console.error("2FA Setup Error:", err);
      toast.error(err.message || "Failed to set up 2FA. Please check your password.");
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async (password: string) => {
    if (!password) {
      toast.error("Password is required to disable 2FA");
      return;
    }
    setIsLoading(true);
    setPasswordModalAction(null);
    try {
      const result = await (authClient as any).twoFactor.disable({ password });
      if (result.error) throw new Error(result.error.message);
      
      toast.success("2FA has been disabled");
      window.location.reload(); // Reload to clear session state immediately
    } catch (err: any) {
      console.error("2FA Disable Error:", err);
      toast.error(err.message || "Failed to disable 2FA. Please check your password.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (totpCode.length !== 6) { setError("Code must be 6 digits"); return; }
    setIsLoading(true);
    setError(null);
    try {
      const result = await (authClient as any).twoFactor.verifyTotp({ code: totpCode });
      if (result.error) { setError("Invalid code. Try again."); return; }

      // Backup codes are already saved in state from the enable step
      setStep("done");
      toast.success("2FA enabled successfully!");
    } catch { setError("Verification failed. Try again."); }
    finally { setIsLoading(false); }
  };

  if (is2FAEnabled) {
    return (
      <div style={{ maxWidth: 672, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ borderRadius: 16, backgroundColor: C.bgCard, border: `1px solid ${C.border}`, padding: 32, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CheckCircle size={32} color={C.success} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.fg, marginBottom: 8 }}>2FA is enabled</h2>
          <p style={{ fontSize: 14, color: C.fgMuted, marginBottom: 24 }}>
            Your account is protected with two-factor authentication.
          </p>
          <button
            onClick={() => setPasswordModalAction("disable")}
            disabled={isLoading}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 20px", borderRadius: 8, backgroundColor: "transparent", color: C.destructive,
              fontWeight: 500, border: `1px solid ${C.destructiveBorder}`, cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.15s"
            }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = C.destructiveBg; }}
            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {isLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
            Disable 2FA
          </button>
        </div>

        <PasswordModal 
          action={passwordModalAction} 
          onClose={() => setPasswordModalAction(null)} 
          onSubmit={(pw) => passwordModalAction === "enable" ? startSetup(pw) : disable2FA(pw)}
          isLoading={isLoading} 
          passwordInput={passwordInput} 
          setPasswordInput={setPasswordInput} 
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 672, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.fg }}>Two-Factor Authentication</h1>
        <p style={{ fontSize: 14, color: C.fgMuted, marginTop: 4 }}>
          Add an extra layer of security to your account
        </p>
      </div>

      <div style={{ borderRadius: 16, backgroundColor: C.bgCard, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, backgroundColor: C.muted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={16} color={C.primary} />
            <h2 style={{ fontWeight: 600, color: C.fg, fontSize: 14 }}>TOTP Authenticator Setup</h2>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <AnimatePresence mode="wait">
            {step === "setup" && (
              <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <Smartphone size={28} color={C.primary} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 600, color: C.fg, marginBottom: 8 }}>Set up authenticator app</h3>
                  <p style={{ fontSize: 14, color: C.fgMuted }}>
                    Use Google Authenticator, Authy, or Microsoft Authenticator to generate one-time codes.
                  </p>
                </div>
                <button
                  id="start-2fa-btn"
                  onClick={() => setPasswordModalAction("enable")}
                  disabled={isLoading}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "12px 24px", borderRadius: 8, backgroundColor: C.primary, color: "#fff",
                    fontWeight: 600, border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.5 : 1, transition: "opacity 0.15s", margin: "0 auto"
                  }}
                  onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.opacity = "0.9"; }}
                  onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.opacity = "1"; }}
                >
                  {isLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  Begin setup
                </button>
              </motion.div>
            )}

            {step === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 8 }}>Scan this QR code with your authenticator app</p>
                  {qrCode && (
                    <div style={{ display: "inline-block", padding: 16, backgroundColor: "#fff", borderRadius: 12 }}>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}`} alt="QR code" style={{ width: 176, height: 176 }} />
                    </div>
                  )}
                </div>

                {secret && (
                  <div style={{ padding: 12, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 12, color: C.fgMuted, marginBottom: 4 }}>Can&apos;t scan? Enter this key manually:</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code style={{ flex: 1, fontSize: 12, fontFamily: "monospace", color: C.fg, wordBreak: "break-all" }}>{secret}</code>
                      <button onClick={() => copy(secret, "Secret key")} style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", display: "flex", padding: 0 }}>
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 8, backgroundColor: C.destructiveBg, border: `1px solid ${C.destructiveBorder}`, fontSize: 14, color: C.destructive }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 6 }}>
                    Enter 6-digit code from your app
                  </label>
                  <input
                    id="totp-code-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 8, backgroundColor: C.input,
                      border: `1px solid ${focused ? C.primary : C.border}`, color: C.fg, textAlign: "center",
                      fontSize: 24, fontFamily: "monospace", letterSpacing: "1rem", outline: "none",
                      boxShadow: focused ? `0 0 0 2px ${C.ring}` : "none", transition: "border-color 0.15s, box-shadow 0.15s"
                    }}
                  />
                </div>

                <button
                  id="verify-2fa-btn"
                  onClick={verifyAndEnable}
                  disabled={isLoading || totpCode.length !== 6}
                  style={{
                    width: "100%", padding: 12, borderRadius: 8, backgroundColor: C.primary, color: "#fff",
                    fontWeight: 600, border: "none", cursor: (isLoading || totpCode.length !== 6) ? "not-allowed" : "pointer",
                    opacity: (isLoading || totpCode.length !== 6) ? 0.5 : 1, transition: "opacity 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}
                >
                  {isLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  Verify and enable 2FA
                </button>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <CheckCircle size={28} color={C.success} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 600, color: C.fg, marginBottom: 8 }}>2FA Enabled!</h3>
                  <p style={{ fontSize: 14, color: C.fgMuted, marginBottom: 16 }}>
                    Save these recovery codes somewhere safe. They can be used to access your account if you lose your authenticator.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {backupCodes.map((code) => (
                    <div key={code} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.03)", fontFamily: "monospace", fontSize: 14, color: C.fg }}>
                      <span style={{ flex: 1 }}>{code}</span>
                      <button onClick={() => copy(code, "Recovery code")} style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", display: "flex", padding: 0 }}>
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: C.destructive, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                  <AlertTriangle size={14} /> These codes will not be shown again. Save them now.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PasswordModal 
        action={passwordModalAction} 
        onClose={() => setPasswordModalAction(null)} 
        onSubmit={(pw) => passwordModalAction === "enable" ? startSetup(pw) : disable2FA(pw)}
        isLoading={isLoading} 
        passwordInput={passwordInput} 
        setPasswordInput={setPasswordInput} 
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
