"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LifeBuoy, Copy, RefreshCcw, AlertCircle, CheckCircle, Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useCopyWithClear } from "@/hooks/useCopyWithClear";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RecoveryPage() {
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { copy } = useCopyWithClear({ clearAfterMs: 60_000 });

  const generateCodes = async () => {
    if (generated && !confirm("Generating new codes will invalidate your old ones. Continue?")) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/recovery", { method: "POST" });
      const data = await res.json();
      setCodes(data.codes);
      setGenerated(true);
      toast.success("Recovery codes generated — save them now!");
    } catch {
      toast.error("Failed to generate recovery codes");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCodes = () => {
    const text = `VaultGuard Recovery Codes\n${"=".repeat(30)}\n\nGenerated: ${new Date().toLocaleString()}\n\nRecovery Codes:\n${codes.map((c) => `  ${c}`).join("\n")}\n\n${"=".repeat(30)}\nEach code can only be used once.\nStore this file securely and do not share it.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vaultguard-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Recovery Center</h1>
        <p className="text-sm text-muted-foreground">
          Emergency access options for your account
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4 bg-muted/20 border-b border-border/30">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-primary" />
            <CardTitle className="text-lg">Recovery Codes</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Recovery codes are one-time use credentials that allow you to access your account if you lose your authenticator app. Keep these in a separate, secure location.
            </p>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex gap-4 text-sm text-orange-500/80 leading-relaxed">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-orange-500" />
              <p>
                <strong className="text-orange-500">Security Warning:</strong> Generating new codes will immediately invalidate all previously issued recovery codes.
              </p>
            </div>
          </div>

          <div className="flex justify-center sm:justify-start pt-2">
            <Button
              onClick={generateCodes}
              disabled={isLoading}
              size="lg"
              className={cn(
                "font-bold transition-all",
                generated ? "variant-outline" : "shadow-lg shadow-primary/20"
              )}
            >
              <RefreshCcw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              {generated ? "Regenerate codes" : "Generate recovery codes"}
            </Button>
          </div>

          <AnimatePresence>
            {codes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pt-6 border-t border-border/30"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {codes.map((code) => (
                    <div key={code} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50 group hover:border-primary/20 transition-all">
                      <code className="text-sm font-mono font-bold text-foreground">{code}</code>
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        onClick={() => copy(code, "Recovery code")}
                        className="opacity-50 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={downloadCodes}
                    className="flex-1 font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download as text
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copy(codes.join("\n"), "All recovery codes")}
                    className="flex-1 font-semibold"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy all codes
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-green-500/5 border border-green-500/10 text-[10px] font-bold text-green-500 uppercase tracking-widest mx-auto w-fit">
                  <CheckCircle className="w-3 h-3" />
                  Successfully generated 8 codes
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
