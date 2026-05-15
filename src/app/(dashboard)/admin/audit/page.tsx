"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Terminal } from "lucide-react";
import { toast } from "sonner";

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#8b5cf6",
};

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

  if (loading) return <div style={{ color: C.fgMuted }}>Loading audit logs...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: C.fg, display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldAlert size={28} color={C.primary} />
          Global Audit Logs
        </h1>
        <p style={{ fontSize: 14, color: C.fgMuted, marginTop: 4 }}>
          System-wide security events and access logs.
        </p>
      </div>

      <div style={{ backgroundColor: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>Time</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>User</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>Action</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>IP Address</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: C.fgMuted, fontWeight: 500 }}>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", color: C.fgMuted, fontSize: 12 }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px", color: C.fg }}>
                    {log.user.email}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ 
                      padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                      backgroundColor: "rgba(139,92,246,0.1)", color: "#a78bfa"
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: C.fgMuted, fontFamily: "monospace", fontSize: 12 }}>
                    {log.ipAddress || "Unknown"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {log.metadata ? (
                      <code style={{ fontSize: 11, color: C.fgMuted, backgroundColor: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>
                        {log.metadata}
                      </code>
                    ) : (
                      <span style={{ color: C.fgMuted }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: "center", color: C.fgMuted }}>
                    No audit logs found.
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
