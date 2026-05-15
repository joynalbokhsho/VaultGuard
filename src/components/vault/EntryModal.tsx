"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { X, Loader2, Globe, FileText, CreditCard, KeyRound, Terminal, User } from "lucide-react";
import { toast } from "sonner";
import { useVaultStore, type DecryptedEntry } from "@/store/vaultStore";
import { encryptVaultEntry } from "@/lib/crypto/vault";
import type { EntryType, VaultEntryData } from "@/lib/crypto/vault";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const entrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["CREDENTIAL", "NOTE", "CARD", "API_KEY", "SSH_KEY", "IDENTITY"]),
  username: z.string().optional(),
  password: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  content: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  service: z.string().optional(),
  privateKey: z.string().optional(),
  publicKey: z.string().optional(),
  passphrase: z.string().optional(),
  hostname: z.string().optional(),
  cardNumber: z.string().optional(),
  cardholderName: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.string().optional(), // comma-separated
});

type EntryFormData = z.infer<typeof entrySchema>;

const typeConfig = [
  { value: "CREDENTIAL" as EntryType, label: "Password", icon: Globe },
  { value: "NOTE" as EntryType, label: "Note", icon: FileText },
  { value: "CARD" as EntryType, label: "Card", icon: CreditCard },
  { value: "API_KEY" as EntryType, label: "API Key", icon: KeyRound },
  { value: "SSH_KEY" as EntryType, label: "SSH Key", icon: Terminal },
  { value: "IDENTITY" as EntryType, label: "Identity", icon: User },
];

interface EntryModalProps {
  mode: "create" | "edit";
  entry?: DecryptedEntry;
  onClose: () => void;
  onSave: () => void;
}

export function EntryModal({ mode, entry, onClose, onSave }: EntryModalProps) {
  const { masterKey } = useVaultStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<EntryType>(
    entry?.type ?? "CREDENTIAL"
  );

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      type: entry?.type ?? "CREDENTIAL",
      title: entry?.data.title ?? "",
      username: entry?.data.username ?? "",
      password: entry?.data.password ?? "",
      url: entry?.data.url ?? "",
      notes: entry?.data.notes ?? "",
      content: entry?.data.content ?? "",
      apiKey: entry?.data.apiKey ?? "",
      service: entry?.data.service ?? "",
      privateKey: entry?.data.privateKey ?? "",
      publicKey: entry?.data.publicKey ?? "",
      hostname: entry?.data.hostname ?? "",
      cardNumber: entry?.data.cardNumber ?? "",
      cardholderName: entry?.data.cardholderName ?? "",
      isFavorite: entry?.isFavorite ?? false,
      tags: entry?.data.tags?.join(", ") ?? "",
    },
  });

  const isFavorite = watch("isFavorite");

  const onSubmit = async (data: EntryFormData) => {
    if (!masterKey) {
      toast.error("Vault is locked");
      return;
    }

    setIsLoading(true);
    try {
      const entryData: VaultEntryData = {
        title: data.title,
        notes: data.notes,
        tags: data.tags?.split(",").map((t) => t.trim()).filter(Boolean),
        createdAt: entry?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        username: data.username,
        password: data.password,
        url: data.url,
        content: data.content,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        service: data.service,
        privateKey: data.privateKey,
        publicKey: data.publicKey,
        passphrase: data.passphrase,
        hostname: data.hostname,
        cardNumber: data.cardNumber,
        cardholderName: data.cardholderName,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvv: data.cvv,
      };

      const { encryptedData, iv } = await encryptVaultEntry(entryData, masterKey);

      const url = mode === "edit" ? `/api/entries/${entry!.id}` : "/api/entries";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedData,
          iv,
          type: selectedType,
          isFavorite: data.isFavorite ?? false,
        }),
      });

      if (!res.ok) throw new Error("Failed to save entry");

      toast.success(mode === "create" ? "Item added to vault" : "Item updated");
      onSave();
      onClose();
    } catch (err) {
      toast.error("Failed to save entry");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] gap-0 p-0 overflow-hidden bg-card border-border/50 shadow-2xl">
        <DialogHeader className="p-6 pb-2 border-b border-border/30">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {mode === "create" ? "Add new item" : "Edit item"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === "create" ? "Create a new encrypted item in your vault." : "Update your encrypted vault item."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-6">
          <form id="entry-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Type selector */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Item Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {typeConfig.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={selectedType === type.value ? "default" : "outline"}
                    className={cn(
                      "h-auto flex-col py-3 gap-1.5 transition-all",
                      selectedType === type.value ? "shadow-md shadow-primary/20" : "bg-card/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setSelectedType(type.value);
                      setValue("type", type.value);
                    }}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="text-[10px] font-semibold">{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="entry-title">Title</Label>
                <Input
                  id="entry-title"
                  placeholder="e.g. GitHub, Amazon, Home Wi-Fi"
                  {...register("title")}
                  className="bg-background/50 border-border/50"
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              {/* Type-specific fields */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedType}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  {selectedType === "CREDENTIAL" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="entry-username">Username or Email</Label>
                        <Input id="entry-username" {...register("username")} placeholder="user@example.com" className="bg-background/50 border-border/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entry-password">Password</Label>
                        <Input id="entry-password" type="password" {...register("password")} placeholder="••••••••" className="bg-background/50 border-border/50 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entry-url">Website URL</Label>
                        <Input id="entry-url" type="url" {...register("url")} placeholder="https://example.com" className="bg-background/50 border-border/50" />
                      </div>
                    </>
                  )}

                  {selectedType === "NOTE" && (
                    <div className="space-y-2">
                      <Label htmlFor="entry-content">Secure Note</Label>
                      <textarea 
                        id="entry-content" 
                        {...register("content")} 
                        placeholder="Type your sensitive information here..." 
                        rows={6}
                        className="flex min-h-[120px] w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                    </div>
                  )}

                  {selectedType === "CARD" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="entry-cardnumber">Card Number</Label>
                        <Input id="entry-cardnumber" {...register("cardNumber")} placeholder="•••• •••• •••• ••••" className="bg-background/50 border-border/50 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entry-cardholder">Cardholder Name</Label>
                        <Input id="entry-cardholder" {...register("cardholderName")} placeholder="FULL NAME" className="bg-background/50 border-border/50" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Expiry MM</Label>
                          <Input {...register("expiryMonth")} placeholder="MM" maxLength={2} className="bg-background/50 border-border/50 text-center" />
                        </div>
                        <div className="space-y-2">
                          <Label>Expiry YY</Label>
                          <Input {...register("expiryYear")} placeholder="YY" maxLength={2} className="bg-background/50 border-border/50 text-center" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input {...register("cvv")} type="password" placeholder="•••" maxLength={4} className="bg-background/50 border-border/50 text-center font-mono" />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedType === "API_KEY" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="entry-service">Service Name</Label>
                        <Input id="entry-service" {...register("service")} placeholder="OpenAI, Stripe, etc." className="bg-background/50 border-border/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entry-apikey">API Key</Label>
                        <Input id="entry-apikey" type="password" {...register("apiKey")} placeholder="sk-..." className="bg-background/50 border-border/50 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entry-api-secret">API Secret</Label>
                        <Input id="entry-api-secret" type="password" {...register("apiSecret")} placeholder="Secret..." className="bg-background/50 border-border/50 font-mono" />
                      </div>
                    </>
                  )}

                  {selectedType === "SSH_KEY" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="entry-hostname">Hostname / Label</Label>
                        <Input id="entry-hostname" {...register("hostname")} placeholder="Production Server" className="bg-background/50 border-border/50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Private Key</Label>
                        <Textarea 
                          {...register("privateKey")} 
                          placeholder="-----BEGIN RSA PRIVATE KEY-----" 
                          className="min-h-[100px] text-[10px] font-mono bg-background/50 border-border/50 resize-none"
                        />
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="h-px bg-border/30" />

            {/* Meta */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entry-tags">Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
                <Input id="entry-tags" {...register("tags")} placeholder="work, finance, social" className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-notes">Additional Notes</Label>
                <Textarea 
                  id="entry-notes" 
                  {...register("notes")} 
                  placeholder="Any extra details..." 
                  className="min-h-[60px] bg-background/50 border-border/50 resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="entry-favorite" 
                  checked={isFavorite}
                  onCheckedChange={(checked) => setValue("isFavorite", !!checked)}
                />
                <label
                  htmlFor="entry-favorite"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Mark as favorite
                </label>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-border/30 bg-muted/20">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            form="entry-form" 
            type="submit" 
            disabled={isLoading}
            className="px-8 shadow-lg shadow-primary/20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isLoading ? "Encrypting..." : mode === "create" ? "Add to vault" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
