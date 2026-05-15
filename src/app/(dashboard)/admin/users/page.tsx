"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";
import { toast } from "sonner";

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#8b5cf6",
};

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  twoFactorEnabled: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(res => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then(data => {
        setUsers(data.users);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load users");
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ color: C.fgMuted }}>Loading users...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: C.fg, display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={28} color={C.primary} />
          User Management
        </h1>
        <p style={{ fontSize: 14, color: C.fgMuted, marginTop: 4 }}>
          View-only user registry. Encrypted vaults cannot be accessed or manipulated.
        </p>
      </div>

      <div style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>User ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>Email</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>Role</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>2FA</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", color: C.fgMuted, fontFamily: "monospace", fontSize: 12 }}>
                    {user.id.split("-")[0]}...
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 500, color: C.fg }}>{user.name || "—"}</div>
                    <div style={{ color: C.fgMuted, fontSize: 12 }}>{user.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ 
                      padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                      backgroundColor: user.role === "admin" ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.05)",
                      color: user.role === "admin" ? "#a78bfa" : C.fgMuted
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ 
                      padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                      backgroundColor: user.twoFactorEnabled ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
                      color: user.twoFactorEnabled ? "#34d399" : "#ef4444"
                    }}>
                      {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: C.fgMuted }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: "center", color: C.fgMuted }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
