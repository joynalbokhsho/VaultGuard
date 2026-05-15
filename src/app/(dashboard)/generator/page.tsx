import type { Metadata } from "next";
import { PasswordGenerator } from "@/components/generator/PasswordGenerator";

export const metadata: Metadata = {
  title: "Password Generator — VaultGuard",
  description: "Generate strong, secure passwords",
};

export default function GeneratorPage() {
  return (
    <div style={{ maxWidth: 672, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0eeff" }}>Password Generator</h1>
        <p style={{ fontSize: 14, color: "#9c99bc", marginTop: 4 }}>
          Generate cryptographically secure passwords
        </p>
      </div>
      <PasswordGenerator />
    </div>
  );
}
