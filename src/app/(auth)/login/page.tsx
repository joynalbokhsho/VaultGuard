import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — VaultGuard",
  description: "Sign in to access your encrypted vault",
};

export default function LoginPage() {
  return <LoginForm />;
}
