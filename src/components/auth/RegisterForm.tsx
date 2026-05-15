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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const fullSchema = registerSchema.extend({
  masterPassword: masterPasswordSchema,
  confirmMasterPassword: z.string(),
}).refine((d) => d.masterPassword === d.confirmMasterPassword, {
  message: "Master passwords do not match",
  path: ["confirmMasterPassword"],
});

type FormData = z.infer<typeof fullSchema>;

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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signUp.email({ 
        email: data.email, 
        password: data.password, 
        name: data.name ?? data.email.split("@")[0], 
        callbackURL: "/vault" 
      });
      
      if (result.error) { 
        setError(result.error.message ?? "Registration failed"); 
        return; 
      }

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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-[450px]">
      <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create your vault</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Free forever. End-to-end encrypted.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-md flex items-center gap-2 overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              {/* Account Details */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input 
                    id="reg-name" 
                    placeholder="Your name" 
                    {...register("name")} 
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email address</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="you@example.com" 
                    {...register("email")} 
                    className="bg-background/50"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Login password</Label>
                  <div className="relative">
                    <Input 
                      id="reg-password" 
                      type={showPw ? "text" : "password"} 
                      placeholder="Min. 8 characters" 
                      {...register("password")} 
                      className="bg-background/50 pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
              </div>

              <div className="h-px bg-border/50 my-4" />

              {/* Security Details */}
              <div className="bg-primary/5 border border-primary/20 rounded-md p-3 flex gap-3 text-xs leading-relaxed text-foreground/80">
                <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                <p>
                  <strong className="text-primary">Master password</strong> is separate from your login password. It encrypts your vault locally. 
                  <span className="font-semibold text-foreground"> If lost, data cannot be recovered.</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-master">Master password</Label>
                  <div className="relative">
                    <Input 
                      id="reg-master" 
                      type={showMaster ? "text" : "password"} 
                      placeholder="Strong passphrase" 
                      {...register("masterPassword", { onChange: (e) => setMasterVal(e.target.value) })}
                      className="bg-background/50 pr-10 font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowMaster(!showMaster)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showMaster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.masterPassword && <p className="text-xs text-destructive">{errors.masterPassword.message}</p>}

                  <AnimatePresence>
                    {masterVal.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-2 mt-2"
                      >
                        {checks.map((c) => {
                          const ok = c.test(masterVal);
                          return (
                            <div key={c.label} className="flex items-center gap-1.5 text-[10px]">
                              <CheckCircle className={`w-3 h-3 ${ok ? "text-green-500" : "text-muted-foreground/30"}`} />
                              <span className={ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-master-confirm">Confirm master password</Label>
                  <Input 
                    id="reg-master-confirm" 
                    type="password" 
                    placeholder="Re-enter master password" 
                    {...register("confirmMasterPassword")} 
                    className="bg-background/50 font-mono"
                  />
                  {errors.confirmMasterPassword && <p className="text-xs text-destructive">{errors.confirmMasterPassword.message}</p>}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create vault
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/30 pt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </CardFooter>
      </Card>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <Lock className="w-3 h-3" />
        <span>Your vault is encrypted before reaching our servers</span>
      </div>
    </motion.div>
  );
}
