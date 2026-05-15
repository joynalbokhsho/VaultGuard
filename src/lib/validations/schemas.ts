import { z } from "zod";

// =====================
// Auth Schemas
// =====================

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const masterPasswordSchema = z
  .string()
  .min(12, "Master password must be at least 12 characters")
  .max(256, "Master password is too long")
  .refine(
    (p) => /[A-Z]/.test(p),
    "Must contain at least one uppercase letter"
  )
  .refine(
    (p) => /[a-z]/.test(p),
    "Must contain at least one lowercase letter"
  )
  .refine(
    (p) => /[0-9]/.test(p),
    "Must contain at least one number"
  );

export const totpVerifySchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
});

// =====================
// Vault Entry Schemas
// =====================

export const entryTypeSchema = z.enum([
  "CREDENTIAL",
  "NOTE",
  "CARD",
  "API_KEY",
  "SSH_KEY",
  "IDENTITY",
]);

export const createEntrySchema = z.object({
  // The encrypted entry data (encrypted client-side before sending)
  encryptedData: z.string().min(1, "Encrypted data is required"),
  iv: z.string().min(1, "IV is required"),
  type: entryTypeSchema,
  isFavorite: z.boolean().optional().default(false),
});

export const updateEntrySchema = z.object({
  encryptedData: z.string().min(1),
  iv: z.string().min(1),
  isFavorite: z.boolean().optional(),
});

export const entryIdSchema = z.object({
  id: z.string().uuid("Invalid entry ID"),
});

// =====================
// Vault Schemas
// =====================

export const createVaultSchema = z.object({
  encryptedData: z.string().min(1),
  iv: z.string().min(1),
  kdfSalt: z.string().min(1),
});

export const updateVaultSchema = z.object({
  encryptedData: z.string().min(1),
  iv: z.string().min(1),
});

// =====================
// Password Generator Schema
// =====================

export const passwordGeneratorSchema = z.object({
  length: z.number().min(8).max(128).default(20),
  uppercase: z.boolean().default(true),
  lowercase: z.boolean().default(true),
  numbers: z.boolean().default(true),
  symbols: z.boolean().default(true),
  excludeAmbiguous: z.boolean().default(false),
  passphrase: z.boolean().default(false),
  wordCount: z.number().min(3).max(10).optional().default(5),
});

// =====================
// Recovery Schema
// =====================

export const recoveryCodeSchema = z.object({
  code: z.string().min(16, "Invalid recovery code"),
});

// =====================
// Device Schema
// =====================

export const deviceSchema = z.object({
  fingerprint: z.string().min(1),
  name: z.string().min(1).max(100),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type CreateVaultInput = z.infer<typeof createVaultSchema>;
export type PasswordGeneratorInput = z.infer<typeof passwordGeneratorSchema>;
