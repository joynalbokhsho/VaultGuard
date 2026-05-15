"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Monitor, LifeBuoy, ChevronRight, Key, Clock } from "lucide-react";
import { useSession, signOut } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#7c3aed",
  destructive: "#ef4444",
  destructiveBg: "rgba(239,68,68,0.1)",
  destructiveBorder: "rgba(239,68,68,0.3)",
  accent: "rgba(255,255,255,0.06)",
  muted: "rgba(255,255,255,0.03)",
  input: "#1a1a2e",
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div style={{ maxWidth: 672, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.fg }}>Settings</h1>
        <p style={{ fontSize: 14, color: C.fgMuted, marginTop: 4 }}>
          Manage your account and security preferences
        </p>
      </div>

      {/* Account section */}
      <Section title="Account" icon={<Key size={16} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between", paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.fg }}>Email</p>
              <p style={{ fontSize: 14, color: C.fgMuted }}>{session?.user?.email}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between", paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.fg }}>Name</p>
              <p style={{ fontSize: 14, color: C.fgMuted }}>{session?.user?.name ?? "Not set"}</p>
            </div>
            <button style={{ background: "none", border: "none", color: C.primary, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Edit</button>
          </div>
        </div>
      </Section>

      {/* Security section */}
      <Section title="Security" icon={<Shield size={16} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SettingsLink
            label="Two-Factor Authentication"
            desc="Add an extra layer of security with TOTP"
            href="/2fa"
          />
          <div style={{ padding: 12, borderRadius: 8, backgroundColor: "transparent", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.fg }}>Passkeys</p>
              <p style={{ fontSize: 12, color: C.fgMuted }}>Sign in with biometrics or a security key</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const { authClient } = await import("@/lib/auth/auth-client");
                  const result = await (authClient as any).passkey.addPasskey();
                  if (result?.error) {
                    toast.error(result.error.message ?? "Failed to add passkey");
                  } else {
                    toast.success("Passkey added successfully!");
                  }
                } catch (e) {
                  toast.error("An error occurred while adding passkey");
                }
              }}
              style={{ padding: "6px 12px", borderRadius: 8, backgroundColor: C.primary, color: "#fff", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}
            >
              Add Passkey
            </button>
          </div>
          <SettingsLink
            label="Active Sessions"
            desc="View and revoke active login sessions"
            href="/sessions"
          />
          <SettingsLink
            label="Recovery Center"
            desc="Generate recovery codes and manage emergency access"
            href="/recovery"
          />
        </div>
      </Section>

      {/* Vault section */}
      <Section title="Vault" icon={<Clock size={16} />}>
        <div style={{ padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "space-between" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.fg }}>Auto-lock timeout</p>
              <p style={{ fontSize: 12, color: C.fgMuted }}>Lock vault after period of inactivity</p>
            </div>
            <select style={{ fontSize: 14, backgroundColor: C.input, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.fg, outline: "none" }}>
              <option value="5">5 minutes</option>
              <option value="15" selected>15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone" borderColor={C.destructiveBorder}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={async () => {
              if (confirm("Sign out of all devices?")) {
                await fetch("/api/sessions", { method: "DELETE" });
                await signOut();
                router.push("/login");
              }
            }}
            style={{
              width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyItems: "space-between",
              padding: 12, borderRadius: 8, backgroundColor: "transparent", color: C.destructive, border: "none",
              cursor: "pointer", transition: "background-color 0.15s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.destructiveBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500 }}>Sign out all devices</p>
              <p style={{ fontSize: 12, opacity: 0.7 }}>Revoke all active sessions</p>
            </div>
            <ChevronRight size={16} />
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title, icon, children, borderColor,
}: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; borderColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 16, backgroundColor: C.bgCard, border: `1px solid ${borderColor || C.border}`, overflow: "hidden" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 24px", borderBottom: `1px solid ${C.border}`, backgroundColor: C.muted }}>
        <span style={{ color: C.primary, display: "flex" }}>{icon}</span>
        <h2 style={{ fontWeight: 600, color: C.fg, fontSize: 14 }}>{title}</h2>
      </div>
      <div style={{ padding: "16px 24px" }}>{children}</div>
    </motion.div>
  );
}

function SettingsLink({ label, desc, href }: { label: string; desc: string; href: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyItems: "space-between",
        padding: 12, borderRadius: 8, backgroundColor: "transparent", border: "none",
        cursor: "pointer", transition: "background-color 0.15s", textAlign: "left"
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.accent}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: C.fg }}>{label}</p>
        <p style={{ fontSize: 12, color: C.fgMuted }}>{desc}</p>
      </div>
      <ChevronRight size={16} color={C.fgMuted} />
    </button>
  );
}
