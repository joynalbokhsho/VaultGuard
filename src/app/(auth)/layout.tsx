import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your VaultGuard account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "rgb(9 9 18)", color: "rgb(240 238 255)" }}
    >
      {/* Top bar */}
      <header
        className="h-16 flex items-center px-6 border-b shrink-0"
        style={{ borderColor: "rgb(40 38 65)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgb(109 40 217)" }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">VaultGuard</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(109,40,217,0.12), transparent)",
          }}
        />
        <div className="relative w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
