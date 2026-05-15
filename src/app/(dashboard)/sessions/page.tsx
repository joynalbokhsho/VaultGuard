"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SessionInfo {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Active Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Manage your active login sessions across all devices
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={revokeAll}
          disabled={isRevoking || sessions.length <= 1}
          className="shadow-lg shadow-destructive/10"
        >
          {isRevoking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
          Revoke all others
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {session.userAgent?.split("(")[0]?.trim() ?? "Unknown device"}
                      </p>
                      {i === 0 && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20 text-[10px] h-4 px-1.5 font-bold uppercase tracking-wider">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      IP: {session.ipAddress ?? "Unknown"} · Created: {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
