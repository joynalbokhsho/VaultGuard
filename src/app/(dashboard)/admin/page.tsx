"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Users, Vault, KeyRound, Monitor, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";


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

  if (loading) return <div className="flex justify-center py-20 text-muted-foreground animate-pulse font-medium">Loading statistics...</div>;
  if (!stats) return <div className="flex justify-center py-20 text-destructive font-bold">Access denied. Administrator privileges required.</div>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Vaults", value: stats.totalVaults, icon: Vault, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Encrypted Entries", value: stats.totalEntries, icon: KeyRound, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Active Sessions", value: stats.totalSessions, icon: Monitor, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Audit Events", value: stats.totalAuditLogs, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <ShieldCheck size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Administration Overview</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Zero-knowledge global telemetry. Individual vault contents remain mathematically inaccessible and private.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{card.label}</span>
                  <div className={cn("p-2 rounded-lg", card.bg)}>
                    <card.icon size={16} className={card.color} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tighter">{card.value.toLocaleString()}</h2>
                  <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div className={cn("h-full w-[60%] rounded-full", card.bg.replace('/10', ''))}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
