"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Smartphone, CheckCircle, Copy, AlertCircle, Loader2, AlertTriangle, Key, Mail } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { useCopyWithClear } from "@/hooks/useCopyWithClear";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function TwoFactorPage() {
  const { data: session } = authClient.useSession();
  const [step, setStep] = useState<"setup" | "verify" | "done">("setup");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordModalAction, setPasswordModalAction] = useState<"enable" | "disable" | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const { copy } = useCopyWithClear();

  const is2FAEnabled = session?.user?.twoFactorEnabled ?? false;
  const isEmailEnabled = (session?.user as any)?.twoFactorEmailEnabled ?? false;
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const toggleEmail2FA = async () => {
    setIsUpdatingEmail(true);
    try {
      const result = await authClient.updateUser({
        // @ts-ignore
        twoFactorEmailEnabled: !isEmailEnabled,
      });
      if (result.error) throw new Error(result.error.message);
      toast.success(`Email 2FA ${!isEmailEnabled ? "enabled" : "disabled"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update email 2FA preference");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

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
      const secretMatch = uri.match(/secret=([^&]+)/);
      setSecret(secretMatch ? secretMatch[1] : "");
      if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
      }
      setStep("verify");
    } catch (err: any) {
      toast.error(err.message || "Failed to set up 2FA. Please check your password.");
    } finally {
      setIsLoading(false);
      setPasswordInput("");
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
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA. Please check your password.");
    } finally {
      setIsLoading(false);
      setPasswordInput("");
    }
  };

  const verifyAndEnable = async () => {
    if (totpCode.length !== 6) { setError("Code must be 6 digits"); return; }
    setIsLoading(true);
    setError(null);
    try {
      const result = await (authClient as any).twoFactor.verifyTotp({ code: totpCode });
      if (result.error) { setError("Invalid code. Try again."); return; }
      setStep("done");
      toast.success("2FA enabled successfully!");
    } catch { setError("Verification failed. Try again."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Two-Factor Authentication</h1>
        <p className="text-sm text-muted-foreground">
          Secure your account with a secondary verification method
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4 bg-muted/20 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <CardTitle className="text-lg">TOTP Authenticator</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <AnimatePresence mode="wait">
            {is2FAEnabled ? (
              <motion.div key="enabled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 pb-4">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto ring-1 ring-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">2FA is enabled</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Your account is protected. You will be asked for a verification code when signing in.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setPasswordModalAction("disable")}
                  disabled={isLoading}
                  className="shadow-lg shadow-destructive/10"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Disable Two-Factor
                </Button>
              </motion.div>
            ) : (
              <>
                {step === "setup" && (
                  <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 pb-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto ring-1 ring-primary/20">
                      <Smartphone className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Authenticator App</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Use apps like Google Authenticator or Microsoft Authenticator to generate secure verification codes.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => setPasswordModalAction("enable")}
                      disabled={isLoading}
                      className="font-bold shadow-lg shadow-primary/20"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Begin Setup
                    </Button>
                  </motion.div>
                )}

                {step === "verify" && (
                  <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                      <div className="p-4 bg-white rounded-xl shadow-inner shrink-0">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}`} 
                          alt="QR code" 
                          className="w-[180px] h-[180px]"
                        />
                      </div>
                      <div className="space-y-4 flex-1">
                        <div className="space-y-2">
                          <h4 className="font-bold">Scan this QR code</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Open your authenticator app and scan the code. If you can&apos;t scan, enter the key below manually.
                          </p>
                        </div>
                        {secret && (
                          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between">
                            <code className="text-xs font-mono text-primary font-bold break-all">{secret}</code>
                            <Button variant="ghost" size="icon-sm" onClick={() => copy(secret, "Secret key")}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/30">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold">Verification Code</label>
                          {error && <span className="text-xs text-destructive font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</span>}
                        </div>
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="000 000"
                          className="text-center text-2xl font-mono tracking-[0.5em] h-14 bg-background/50 focus:ring-primary/20"
                          autoFocus
                        />
                      </div>
                      <Button
                        className="w-full h-12 font-bold shadow-lg shadow-primary/20"
                        onClick={verifyAndEnable}
                        disabled={isLoading || totpCode.length !== 6}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Complete Setup
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === "done" && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto ring-1 ring-green-500/20">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">Setup Complete!</h3>
                        <p className="text-sm text-muted-foreground">Save these recovery codes. They are required if you lose access to your device.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code) => (
                        <div key={code} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50 group">
                          <code className="text-xs font-mono font-semibold">{code}</code>
                          <Button variant="ghost" size="icon-xs" onClick={() => copy(code, "Recovery code")}>
                            <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive font-medium leading-relaxed">
                        These codes will not be shown again. Store them in a safe place (like a physical safe or another encrypted vault).
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4 bg-muted/20 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <CardTitle className="text-lg">Email Verification</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Receive codes via email</p>
              <p className="text-xs text-muted-foreground">
                Get a verification code in your inbox when signing in.
              </p>
            </div>
            <Button
              variant={isEmailEnabled ? "outline" : "default"}
              size="sm"
              disabled={isUpdatingEmail}
              onClick={toggleEmail2FA}
            >
              {isUpdatingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : (isEmailEnabled ? "Disable" : "Enable")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!passwordModalAction} onOpenChange={(open) => !open && setPasswordModalAction(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              Please enter your <strong>login password</strong> to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter password"
                className="pl-10"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && passwordInput && !isLoading) {
                    passwordModalAction === "enable" ? startSetup(passwordInput) : disable2FA(passwordInput);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasswordModalAction(null)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant={passwordModalAction === "disable" ? "destructive" : "default"}
              disabled={!passwordInput || isLoading}
              onClick={() => passwordModalAction === "enable" ? startSetup(passwordInput) : disable2FA(passwordInput)}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
