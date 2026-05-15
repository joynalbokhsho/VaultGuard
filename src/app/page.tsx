"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ShieldCheck, Lock, Shield, Key, Fingerprint, RefreshCcw, 
  Eye, ArrowRight, CheckCircle, LockKeyhole, StickyNote, 
  CreditCard, Terminal, IdCard, Globe 
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  { icon: Lock,        title: "Zero-Knowledge Architecture", color: "text-purple-400", bg: "bg-purple-400/10", desc: "Your vault is encrypted in your browser before it ever reaches our servers. We literally cannot read your passwords. Nobody can." },
  { icon: Shield,      title: "AES-256-GCM Encryption",      color: "text-blue-400", bg: "bg-blue-400/10", desc: "Military-grade encryption standard used by governments and financial institutions. Each entry encrypted individually with a unique IV." },
  { icon: Key,         title: "PBKDF2 Key Derivation",       color: "text-emerald-400", bg: "bg-emerald-400/10", desc: "Your master password is never sent to our servers. 600,000 iterations of PBKDF2-SHA512 derive your encryption key locally." },
  { icon: Fingerprint, title: "Passkey / WebAuthn",          color: "text-orange-400", bg: "bg-orange-400/10",  desc: "Login with biometrics or hardware security keys. No passwords needed — the future of authentication, available today." },
  { icon: RefreshCcw,  title: "2FA & Recovery Codes",        color: "text-pink-400", bg: "bg-pink-400/10", desc: "TOTP two-factor authentication compatible with Google Authenticator, Authy, and more. Encrypted recovery codes for emergencies." },
  { icon: Eye,         title: "Breach Detection",            color: "text-yellow-400", bg: "bg-yellow-400/10",  desc: "Check if your passwords appear in known data breaches using the HaveIBeenPwned API — securely, with k-anonymity." },
];

const vaultTypes = [
  { icon: LockKeyhole, label: "Passwords" },
  { icon: StickyNote, label: "Secure Notes" },
  { icon: CreditCard, label: "Bank Cards" },
  { icon: Key, label: "API Keys" },
  { icon: Terminal, label: "SSH Keys" },
  { icon: IdCard, label: "Identities" },
];

const steps = [
  { n: "01", title: "Master password never leaves", desc: "Your master password never leaves your browser. PBKDF2-SHA512 (600,000 iterations) derives your encryption key locally — nothing is sent to our servers." },
  { n: "02", title: "Client-side encryption", desc: "Using AES-256-GCM via Web Crypto API, each vault entry is encrypted individually with a unique random IV. Only ciphertext is sent to the server." },
  { n: "03", title: "We store only encrypted blobs", desc: "Our database contains only encrypted bytes and KDF salts. Even if our entire server is compromised, attackers cannot read your data." },
  { n: "04", title: "Decryption happens locally", desc: "When you unlock your vault, encrypted data downloads to your browser and decrypts locally. The decrypted data never touches our infrastructure." },
];

const badges = ["AES-256-GCM", "PBKDF2-SHA512", "Zero-Knowledge", "WebAuthn", "TOTP 2FA", "CSP Headers", "HSTS", "Open Source"];
const checks = ["No credit card", "End-to-end encrypted", "Open source", "Free forever"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground">
      
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">VaultGuard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Sign in
            </Link>
            <Link 
              href="/register" 
              className={cn(buttonVariants({ size: "sm" }), "shadow-lg shadow-primary/20")}
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-8 px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-medium tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 mr-2" />
              Zero-Knowledge · Open Source · Secure
            </Badge>

            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8">
              Your passwords,{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                encrypted before
              </span>
              {" "}we see them
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
              VaultGuard uses AES-256-GCM encryption, derived from your master password in your browser. 
              Your data reaches our servers as unreadable ciphertext — even we cannot decrypt it.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/register" 
                className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto h-14 px-8 text-base font-bold shadow-xl shadow-primary/20")}
              >
                Create your free vault <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/login" 
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto h-14 px-8 text-base font-bold bg-background/50 border-border/50")}
              >
                Access Vault
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap justify-center gap-2">
              {badges.map(b => (
                <Badge key={b} variant="secondary" className="px-3 py-1 bg-muted/40 border-border/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {b}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── VAULT TYPES ── */}
      <section className="py-12 bg-muted/20 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-10">
            Store any type of secret
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {vaultTypes.map(v => (
              <motion.div 
                key={v.label} 
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm flex flex-col items-center gap-3 transition-all"
              >
                <v.icon className="w-8 h-8 text-foreground/80 stroke-[1.5]" />
                <span className="text-xs font-bold text-muted-foreground">{v.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Security at every layer</h2>
            <p className="text-muted-foreground text-lg">Every feature is designed with security as the first principle, not an afterthought.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={f.title} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-border/40 bg-card/30 hover:bg-card/50 hover:border-border transition-all group overflow-hidden">
                  <CardContent className="p-8">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-inner", f.bg)}>
                      <f.icon className={cn("w-6 h-6", f.color)} />
                    </div>
                    <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-card/40 border-y border-border/30 relative">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">How zero-knowledge works</h2>
            <p className="text-muted-foreground text-lg">Your data is yours alone — by design, not by policy.</p>
          </div>

          <div className="space-y-4">
            {steps.map((s, i) => (
              <motion.div 
                key={s.n} 
                initial={{ opacity: 0, x: -20 }} 
                whileInView={{ opacity: 1, x: 0 }} 
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-border/40 bg-background/50 hover:bg-background transition-colors"
              >
                <span className="text-4xl font-black text-primary/20 font-mono tracking-tighter shrink-0">{s.n}</span>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] -z-10" />
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Protect your digital identity</h2>
            <p className="text-lg text-muted-foreground mb-10">Free forever. No credit card. Your data stays yours — always.</p>
            
            <div className="flex flex-col items-center gap-8">
              <Link 
                href="/register" 
                className={cn(buttonVariants({ size: "lg" }), "h-14 px-10 text-base font-bold shadow-2xl shadow-primary/30")}
              >
                Get started for free <ArrowRight className="ml-2 w-5 h-5" />
              </Link>

              <div className="flex flex-wrap justify-center gap-6">
                {checks.map(c => (
                  <div key={c} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4 text-primary" /> {c}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-border/50 bg-card/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">VaultGuard</span>
          </div>
          <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <span>Zero-Knowledge</span>
            <span>AES-256-GCM</span>
            <span>Open Source</span>
          </div>
          <a 
            href="https://github.com/your-username/vaultguard" 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <Globe className="w-5 h-5" />
          </a>
        </div>
        <div className="mt-8 text-center text-[10px] text-muted-foreground/40">
          © {new Date().getFullYear()} VaultGuard Encryption Systems. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
