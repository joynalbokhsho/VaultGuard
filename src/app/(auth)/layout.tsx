import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your VaultGuard account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="h-16 flex items-center px-6 border-b border-border/50 shrink-0 bg-background/50 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary shadow-lg shadow-primary/20">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">VaultGuard</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        
        <div className="relative w-full flex justify-center">
          {children}
        </div>
      </main>
    </div>
  );
}
