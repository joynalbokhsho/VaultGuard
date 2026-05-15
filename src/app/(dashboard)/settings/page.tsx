"use client";

import { motion } from "framer-motion";
import { Shield, ChevronRight, Key, Clock, Fingerprint, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account security and vault preferences
        </p>
      </div>

      {/* Account section */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <CardTitle className="text-lg">Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Email address</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">VERIFIED</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Display Name</p>
              <p className="text-sm text-muted-foreground">{session?.user?.name ?? "Not set"}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security section */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <CardTitle className="text-lg">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingsLink
            label="Two-Factor Authentication"
            desc="Add an extra layer of security with TOTP authenticator"
            href="/2fa"
          />
          
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Passkeys</p>
              <p className="text-xs text-muted-foreground">Sign in with biometrics or security keys</p>
            </div>
            <Button
              size="sm"
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
            >
              <Fingerprint className="w-3.5 h-3.5 mr-2" />
              Add Passkey
            </Button>
          </div>

          <SettingsLink
            label="Active Sessions"
            desc="View and manage devices currently logged into your account"
            href="/sessions"
          />
          <SettingsLink
            label="Recovery Center"
            desc="Generate recovery codes and emergency access options"
            href="/recovery"
          />
        </CardContent>
      </Card>

      {/* Vault section */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <CardTitle className="text-lg">Vault Behavior</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Auto-lock timeout</p>
              <p className="text-xs text-muted-foreground">Lock vault after period of inactivity</p>
            </div>
            <Select defaultValue="15">
              <SelectTrigger className="w-[140px] h-9 bg-muted/30">
                <SelectValue placeholder="Select timeout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-destructive/10 bg-destructive/5">
          <h2 className="text-sm font-bold text-destructive flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Danger Zone
          </h2>
        </div>
        <CardContent className="p-0">
          <button
            onClick={async () => {
              if (confirm("Sign out of all devices?")) {
                await fetch("/api/sessions", { method: "DELETE" });
                await signOut();
                router.push("/login");
              }
            }}
            className="w-full text-left p-4 hover:bg-destructive/10 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-destructive">Sign out of all devices</p>
                <p className="text-xs text-destructive/70">Revoke all active sessions and force re-login</p>
              </div>
              <ChevronRight className="w-4 h-4 text-destructive opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsLink({ label, desc, href }: { label: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-all group"
    >
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-all" />
    </Link>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode; variant?: "outline" | "default"; className?: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-[10px] font-bold",
      variant === "outline" ? "border border-border/50 text-muted-foreground" : "bg-primary text-primary-foreground",
      className
    )}>
      {children}
    </span>
  );
}
