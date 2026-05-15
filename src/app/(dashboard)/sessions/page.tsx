"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#7c3aed",
  primaryBg: "rgba(124,58,237,0.1)",
  destructive: "#ef4444",
  destructiveBg: "rgba(239,68,68,0.1)",
  destructiveHover: "rgba(239,68,68,0.2)",
  success: "#10b981",
  successBg: "rgba(16,185,129,0.1)",
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchSessions = async () => {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    setSessions(data.sessions);
    setIsLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  const revokeAll = async () => {
    if (!confirm("Revoke all other sessions? You will remain logged in on this device.")) return;
    setIsRevoking(true);
    await fetch("/api/sessions", { method: "DELETE" });
    toast.success("All other sessions revoked");
    fetchSessions();
    setIsRevoking(false);
  };

  return (
    <div style={{ maxWidth: 672, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.fg }}>Active Sessions</h1>
          <p style={{ fontSize: 14, color: C.fgMuted, marginTop: 4 }}>
            Manage your active login sessions
          </p>
        </div>
        <button
          onClick={revokeAll}
          disabled={isRevoking || sessions.length <= 1}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8,
            backgroundColor: C.destructiveBg, color: C.destructive, fontSize: 14, fontWeight: 500,
            border: "none", cursor: (isRevoking || sessions.length <= 1) ? "not-allowed" : "pointer",
            opacity: (isRevoking || sessions.length <= 1) ? 0.5 : 1, transition: "background-color 0.15s"
          }}
          onMouseEnter={(e) => { if (!isRevoking && sessions.length > 1) e.currentTarget.style.backgroundColor = C.destructiveHover; }}
          onMouseLeave={(e) => { if (!isRevoking && sessions.length > 1) e.currentTarget.style.backgroundColor = C.destructiveBg; }}
        >
          {isRevoking ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={16} />}
          Revoke all others
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={32} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: 16, borderRadius: 12, backgroundColor: C.bgCard, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 16
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Monitor size={20} color={C.primary} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: C.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {session.userAgent?.split("(")[0]?.trim() ?? "Unknown device"}
                  {i === 0 && (
                    <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 6px", borderRadius: 999, backgroundColor: C.successBg, color: C.success, fontWeight: 500 }}>
                      Current
                    </span>
                  )}
                </p>
                <p style={{ fontSize: 12, color: C.fgMuted }}>
                  IP: {session.ipAddress ?? "Unknown"} · Created: {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
