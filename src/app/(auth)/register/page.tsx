import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account — VaultGuard",
  description: "Create your VaultGuard account and set up your encrypted vault",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
