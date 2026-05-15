"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useVaultStore } from "@/store/vaultStore";
import { deriveMasterKey } from "@/lib/crypto/keyDerivation";
import { verifyMasterKey } from "@/lib/crypto/vault";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function VaultUnlock() {
  const { setMasterKey, setUnlocking, isUnlocking } = useVaultStore();
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword.trim()) return;

    setUnlocking(true);
    setError(null);

    try {
      const res = await fetch("/api/vault");
      if (!res.ok) throw new Error("Failed to fetch vault");
      const { vault, kdfSalt } = await res.json();

      if (!vault || !kdfSalt) {
        setError("Vault not found. Please contact support.");
        return;
      }

      const masterKey = await deriveMasterKey(masterPassword, kdfSalt);
      const isValid = await verifyMasterKey(
        `${vault.iv}:${vault.encryptedData}`,
        masterKey
      );

      if (!isValid) {
        setError("Incorrect master password. Please try again.");
        return;
      }

      setMasterKey(masterKey);
      toast.success("Vault unlocked");
    } catch (err) {
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
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[384px]"
      >
        <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-md">
          <CardHeader className="text-center space-y-4">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-inner"
            >
              <Lock className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="space-y-1.5">
              <CardTitle className="text-xl font-bold tracking-tight">Unlock your vault</CardTitle>
              <CardDescription>
                Enter your master password to decrypt your vault
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <Input
                  id="master-password-input"
                  type={showPassword ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Master password"
                  autoFocus
                  autoComplete="off"
                  className="pr-10 h-12 bg-background/50 border-border/50 font-mono tracking-widest focus:tracking-normal transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                id="vault-unlock-btn"
                type="submit"
                className="w-full h-11 shadow-lg shadow-primary/20 font-bold"
                disabled={isUnlocking || !masterPassword}
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Decrypting vault…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Unlock vault
                  </>
                )}
              </Button>
            </form>

            <p className="text-[10px] text-center text-muted-foreground/60 mt-6 uppercase tracking-widest font-medium">
              Zero-knowledge encryption
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
