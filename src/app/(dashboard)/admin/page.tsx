"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Users, Vault, KeyRound, Monitor, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#8b5cf6",
};

interface Stats {
  totalUsers: number;
  totalVaults: number;
  totalEntries: number;
  totalSessions: number;
  totalAuditLogs: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        toast.error("Failed to load admin stats");
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ color: C.fgMuted }}>Loading statistics...</div>;
  if (!stats) return <div style={{ color: "#ef4444" }}>Access denied.</div>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#3b82f6" },
    { label: "Active Vaults", value: stats.totalVaults, icon: Vault, color: "#10b981" },
    { label: "Encrypted Entries", value: stats.totalEntries, icon: KeyRound, color: "#8b5cf6" },
    { label: "Active Sessions", value: stats.totalSessions, icon: Monitor, color: "#f59e0b" },
    { label: "Audit Log Events", value: stats.totalAuditLogs, icon: ShieldAlert, color: "#ef4444" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: C.fg, display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={28} color={C.primary} />
          Administration Overview
        </h1>
        <p style={{ fontSize: 14, color: C.fgMuted, marginTop: 4 }}>
          Zero-knowledge global statistics. Vault contents remain mathematically inaccessible.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
        {cards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.fgMuted }}>{card.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${card.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <card.icon size={16} color={card.color} />
              </div>
            </div>
            <span style={{ fontSize: 32, fontWeight: 700, color: C.fg }}>{card.value.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
