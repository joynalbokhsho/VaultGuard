"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Terminal, Clock, Activity } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: string;
  user: { email: string };
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then(res => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then(data => {
        setLogs(data.logs);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load audit logs");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center py-20 text-muted-foreground animate-pulse font-medium">Scanning system logs...</div>;

  return (
    <div className="space-y-8">
      <div className="space-y-1 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <ShieldAlert size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Audit Logs</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Immutable history of system-wide security events, authentication attempts, and administrative actions.
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[180px] font-bold text-[10px] uppercase tracking-widest pl-6">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-primary" /> Timestamp
                </div>
              </TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest">Operator</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Action</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest">Source IP</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest pr-6">Metadata Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/20 border-border/30 group">
                <TableCell className="text-xs text-muted-foreground pl-6 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </TableCell>
                <TableCell className="font-medium text-sm text-foreground">
                  {log.user.email}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant="outline"
                    className="text-[10px] font-black uppercase tracking-tight px-2 h-5 bg-primary/5 text-primary border-primary/10"
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-[10px] text-muted-foreground">
                  {log.ipAddress || "INTERNAL"}
                </TableCell>
                <TableCell className="pr-6">
                  {log.metadata ? (
                    <div className="flex items-center gap-2 max-w-[300px]">
                      <Terminal size={12} className="text-muted-foreground shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                      <code className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/30 truncate block">
                        {log.metadata}
                      </code>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/30 text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-medium italic">
                  <Activity size={32} className="mx-auto mb-4 opacity-20" />
                  No security events have been logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
