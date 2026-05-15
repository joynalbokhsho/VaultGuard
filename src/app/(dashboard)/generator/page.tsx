import type { Metadata } from "next";
import { PasswordGenerator } from "@/components/generator/PasswordGenerator";

export const metadata: Metadata = {
  title: "Password Generator — VaultGuard",
  description: "Generate strong, secure passwords",
};

export default function GeneratorPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Password Generator</h1>
        <p className="text-sm text-muted-foreground">
          Generate cryptographically secure passwords and passphrases
        </p>
      </div>
      <PasswordGenerator />
    </div>
  );
}
