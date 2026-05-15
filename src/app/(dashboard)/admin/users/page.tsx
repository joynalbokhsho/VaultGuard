"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, ShieldCheck } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  if (loading) return <div className="flex justify-center py-20 text-muted-foreground animate-pulse font-medium">Loading user registry...</div>;

  return (
    <div className="space-y-8">
      <div className="space-y-1 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Users size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Global user registry. Passwords and vault secrets are never stored on our servers and cannot be viewed by administrators.
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-widest pl-6">ID Fragment</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest">User Details</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest">Access Role</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest">Security</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest pr-6 text-right">Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/20 border-border/30">
                <TableCell className="font-mono text-[10px] text-muted-foreground pl-6">
                  {user.id.split("-")[0]}...
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">{user.name || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-tighter px-1.5 h-5",
                      user.role === "admin" ? "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/10" : "bg-muted/50"
                    )}
                  >
                    {user.role === "admin" && <Shield className="w-2.5 h-2.5 mr-1" />}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold px-2 h-5 border-0",
                      user.twoFactorEnabled ? "text-green-500 bg-green-500/5" : "text-muted-foreground/50 bg-muted/20"
                    )}
                  >
                    {user.twoFactorEnabled ? "2FA ACTIVE" : "2FA INACTIVE"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6 text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium italic">
                  No registered users found in the system.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
