"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="w-full max-w-[400px]"
    >
      <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Set new password</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {done ? "Your password has been reset." : "Choose a strong password for your account."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-md flex items-center gap-2 overflow-hidden mb-4"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {done ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Success!</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Redirecting you to sign in...
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input 
                    id="new-password" 
                    type={showPw ? "text" : "password"} 
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 bg-background/50"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="Re-enter new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="bg-background/50"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !token}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isLoading ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/30 pt-6">
          <Link 
            href="/forgot-password"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground")}
          >
            Request a new reset link
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
