import type { Metadata } from "next";
import { VaultDashboard } from "@/components/vault/VaultDashboard";

export const metadata: Metadata = {
  title: "My Vault — VaultGuard",
  description: "Access and manage your encrypted vault",
};

export default function VaultPage() {
  return <VaultDashboard />;
}
