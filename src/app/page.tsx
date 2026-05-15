"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Lock, Shield, Key, Fingerprint, RefreshCcw, Eye, ArrowRight, CheckCircle, LockKeyhole, StickyNote, CreditCard, Terminal, IdCard } from "lucide-react";

/* ─────────── DESIGN TOKENS ─────────── */
const C = {
  bg: "#09090f",
  bgCard: "#111120",
  bgHover: "#1a1a2e",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#7c3aed",
  primaryLight: "#8b5cf6",
  primaryGlow: "rgba(109,40,217,0.15)",
};

const nav: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 clamp(16px, 5vw, 32px)",
  height: "64px",
  backgroundColor: "rgba(9,9,15,0.88)",
  borderBottom: `1px solid ${C.border}`,
  backdropFilter: "blur(16px)",
};

const section = (opts: React.CSSProperties = {}): React.CSSProperties => ({
  width: "100%",
  padding: "80px 24px",
  ...opts,
});

const container = (maxW = "1100px"): React.CSSProperties => ({
  maxWidth: maxW,
  margin: "0 auto",
  width: "100%",
});

const card: React.CSSProperties = {
  backgroundColor: C.bgCard,
  border: `1px solid ${C.border}`,
  borderRadius: "16px",
  padding: "24px",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "14px 32px",
  borderRadius: "12px",
  backgroundColor: C.primary,
  color: "#fff",
  fontWeight: 600,
  fontSize: "16px",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  transition: "opacity 0.15s",
};

const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "14px 32px",
  borderRadius: "12px",
  backgroundColor: "transparent",
  color: C.fg,
  fontWeight: 600,
  fontSize: "16px",
  textDecoration: "none",
  border: `1px solid ${C.border}`,
  cursor: "pointer",
  transition: "background-color 0.15s",
};

const features = [
  { icon: Lock,        title: "Zero-Knowledge Architecture", color: "#a78bfa", bg: "rgba(139,92,246,0.1)", desc: "Your vault is encrypted in your browser before it ever reaches our servers. We literally cannot read your passwords. Nobody can." },
  { icon: Shield,      title: "AES-256-GCM Encryption",      color: "#60a5fa", bg: "rgba(96,165,250,0.1)", desc: "Military-grade encryption standard used by governments and financial institutions. Each entry encrypted individually with a unique IV." },
  { icon: Key,         title: "PBKDF2 Key Derivation",       color: "#34d399", bg: "rgba(52,211,153,0.1)", desc: "Your master password is never sent to our servers. 600,000 iterations of PBKDF2-SHA512 derive your encryption key locally." },
  { icon: Fingerprint, title: "Passkey / WebAuthn",          color: "#fb923c", bg: "rgba(251,146,60,0.1)",  desc: "Login with biometrics or hardware security keys. No passwords needed — the future of authentication, available today." },
  { icon: RefreshCcw,  title: "2FA & Recovery Codes",        color: "#f472b6", bg: "rgba(244,114,182,0.1)", desc: "TOTP two-factor authentication compatible with Google Authenticator, Authy, and more. Encrypted recovery codes for emergencies." },
  { icon: Eye,         title: "Breach Detection",            color: "#facc15", bg: "rgba(250,204,21,0.1)",  desc: "Check if your passwords appear in known data breaches using the HaveIBeenPwned API — securely, with k-anonymity." },
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
  { n: "01", title: "You enter your master password", desc: "Your master password never leaves your browser. PBKDF2-SHA512 (600,000 iterations) derives your encryption key locally — nothing is sent to our servers." },
  { n: "02", title: "Your browser encrypts your data", desc: "Using AES-256-GCM via Web Crypto API, each vault entry is encrypted individually with a unique random IV. Only ciphertext is sent to the server." },
  { n: "03", title: "We store only encrypted blobs", desc: "Our database contains only encrypted bytes and KDF salts. Even if our entire server is compromised, attackers cannot read your data." },
  { n: "04", title: "Decryption happens locally", desc: "When you unlock your vault, encrypted data downloads to your browser and decrypts locally. The decrypted data never touches our infrastructure." },
];

const badges = ["AES-256-GCM", "PBKDF2-SHA512", "Zero-Knowledge", "WebAuthn", "TOTP 2FA", "CSP Headers", "HSTS", "Open Source"];
const checks = ["No credit card", "End-to-end encrypted", "Open source", "Free forever"];

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: C.bg, color: C.fg, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav style={nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShieldCheck size={18} color="#fff" />
          </div>
          <span className="hidden sm:inline" style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>VaultGuard</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/login" style={{ padding: "8px 12px", fontSize: 14, fontWeight: 500, color: C.fgMuted, textDecoration: "none", borderRadius: 8, whiteSpace: "nowrap" }}>
            Sign in
          </Link>
          <Link href="/register" style={{ ...primaryBtn, padding: "8px 16px", fontSize: 14, whiteSpace: "nowrap" }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ ...section({ paddingTop: "140px", paddingBottom: "80px" }), position: "relative", overflow: "hidden" }}>
        {/* glow */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 800, height: 500, background: "radial-gradient(ellipse at center, rgba(109,40,217,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ ...container("900px"), textAlign: "center", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, backgroundColor: "rgba(109,40,217,0.12)", border: "1px solid rgba(109,40,217,0.3)", color: "#a78bfa", fontSize: 13, fontWeight: 500, marginBottom: 32 }}>
              <ShieldCheck size={14} />
              Zero-Knowledge · Open Source · Production-Grade
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 24, color: "#fff" }}>
              Your passwords,{" "}
              <span style={{ background: "linear-gradient(135deg, #a78bfa, #c084fc, #e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                encrypted before
              </span>
              {" "}we see them
            </h1>

            <p style={{ fontSize: 18, color: C.fgMuted, maxWidth: 580, margin: "0 auto 40px", lineHeight: 1.7 }}>
              VaultGuard uses AES-256-GCM encryption, derived from your master password in your browser. Your data reaches our servers as unreadable ciphertext — even we cannot decrypt it.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" style={primaryBtn}>
                Create free vault <ArrowRight size={18} />
              </Link>
              <Link href="/login" style={ghostBtn}>
                Sign in
              </Link>
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ marginTop: 52, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {badges.map(b => (
              <span key={b} style={{ padding: "4px 12px", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, fontSize: 12, color: C.fgMuted, fontWeight: 500 }}>
                {b}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── VAULT TYPES ── */}
      <section style={{ ...section({ paddingTop: 32, paddingBottom: 60 }) }}>
        <div style={container()}>
          <p style={{ textAlign: "center", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: C.fgMuted, marginBottom: 24 }}>
            Store any type of secret
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {vaultTypes.map(v => (
              <motion.div key={v.label} whileHover={{ y: -4 }}
                style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 12px" }}>
                <span style={{ display: "flex", color: C.fg }}><v.icon size={28} strokeWidth={1.5} /></span>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.fgMuted }}>{v.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={section()}>
        <div style={container()}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, color: "#fff", marginBottom: 12 }}>
              Security at every layer
            </h2>
            <p style={{ fontSize: 17, color: C.fgMuted, maxWidth: 520, margin: "0 auto" }}>
              Every feature is designed with security as the first principle, not an afterthought.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }} whileHover={{ y: -4 }}
                style={{ ...card }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: f.bg, border: `1px solid ${f.bg}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <f.icon size={22} color={f.color} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.fgMuted, lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ ...section(), backgroundColor: C.bgCard, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={container("780px")}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, color: "#fff", marginBottom: 12 }}>
              How zero-knowledge works
            </h2>
            <p style={{ fontSize: 17, color: C.fgMuted }}>Your data is yours alone — by design, not by policy.</p>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
                style={{ ...card, backgroundColor: C.bg }} className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "monospace", color: "rgba(139,92,246,0.35)", minWidth: 56, lineHeight: 1, paddingTop: 4 }}>
                  {s.n}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: C.fgMuted, lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ ...section(), position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(109,40,217,0.1), transparent)", pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ ...container("680px"), textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Start protecting your passwords today
          </h2>
          <p style={{ fontSize: 17, color: C.fgMuted, marginBottom: 40 }}>
            Free forever. No credit card. Your data stays yours — always.
          </p>
          <Link href="/register" style={primaryBtn}>
            Create your free vault <ArrowRight size={18} />
          </Link>
          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: "12px 28px", justifyContent: "center" }}>
            {checks.map(c => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: C.fgMuted }}>
                <CheckCircle size={15} color="#34d399" /> {c}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 32px" }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4" style={{ ...container() }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} color={C.primaryLight} />
            <span style={{ fontWeight: 600, color: "#fff" }}>VaultGuard</span>
          </div>
          <span style={{ fontSize: 13, color: C.fgMuted }}>Zero-knowledge · AES-256-GCM · Open Source</span>
        </div>
      </footer>
    </div>
  );
}
