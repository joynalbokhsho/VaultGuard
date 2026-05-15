"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

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
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Forgot password?</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {sent ? "Check your inbox for a reset link." : "Enter your email and we'll send you a reset link."}
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

          {sent ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Email Sent</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If an account exists for <strong className="text-foreground">{email}</strong>, a password reset link has been sent. Check your spam folder if you don&apos;t see it.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/30 pt-6">
          <Link 
            href="/login" 
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground flex items-center gap-2")}
          >
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
