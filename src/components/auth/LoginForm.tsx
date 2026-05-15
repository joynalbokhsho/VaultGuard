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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await (signIn as any).email({ 
        email: data.email, 
        password: data.password, 
        callbackURL: "/vault" 
      });
      
      if (result.error) { 
        setError(result.error.message ?? "Invalid email or password"); 
        return; 
      }
      
      if (result.data?.twoFactorRedirect) {
        setRequiresTwoFactor(true);
        return;
      }

      toast.success("Welcome back!");
      window.location.href = "/vault";
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
      window.location.href = "/vault";
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-[400px]">
      <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Sign in to access your encrypted vault
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

          <AnimatePresence mode="wait">
            {!requiresTwoFactor ? (
              <motion.form 
                key="login" 
                onSubmit={handleSubmit(onSubmit)} 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email address</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="you@example.com"
                    {...register("email")}
                    className="bg-background/50"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="login-password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input 
                      id="login-password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      {...register("password")}
                      className="bg-background/50 pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign in
                </Button>
              </motion.form>
            ) : (
              <motion.form 
                key="2fa" 
                onSubmit={onVerifyTwoFactor} 
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="space-y-4"
              >
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app or email.
                  </p>
                  <Button 
                    type="button"
                    variant="link" 
                    size="sm"
                    className="text-xs h-auto p-0 font-bold text-primary hover:text-primary/80"
                    onClick={async () => {
                      try {
                        const result = await (authClient as any).twoFactor.sendVerificationCode();
                        if (result.error) throw new Error(result.error.message);
                        toast.success("Verification code sent to your email!");
                      } catch (e: any) {
                        toast.error(e.message || "Failed to send code. Please try again.");
                      }
                    }}
                  >
                    Send code to email instead
                  </Button>
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-background/50"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setRequiresTwoFactor(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[2]"
                    disabled={isLoading || totpCode.length !== 6}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>

        <div className="px-6">
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="flex-shrink mx-4 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">OR</span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>
        </div>

        <CardFooter className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full bg-background/30"
            disabled={isLoading}
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
          >
            <Fingerprint className="w-4 h-4 mr-2" />
            Sign in with Passkey
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">Create one free</Link>
          </p>
        </CardFooter>
      </Card>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <Lock className="w-3 h-3" />
        <span>End-to-end encrypted · Zero-knowledge architecture</span>
      </div>
    </motion.div>
  );
}
