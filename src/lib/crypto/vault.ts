/**
 * HIGH-LEVEL VAULT ENCRYPTION OPERATIONS
 * ========================================
 * Combines key derivation + AES-256-GCM to provide vault-level
 * encrypt/decrypt operations.
 */

import {
  encrypt,
  decrypt,
  serializePayload,
  deserializePayload,
  type EncryptedPayload,
} from "./encryption";

export type EntryType =
  | "CREDENTIAL"
  | "NOTE"
  | "CARD"
  | "API_KEY"
  | "SSH_KEY"
  | "IDENTITY";

export interface VaultEntryData {
  // Common fields
  title: string;
  notes?: string;
  tags?: string[];
  customFields?: CustomField[];
  createdAt: string;
  updatedAt: string;

  // CREDENTIAL
  username?: string;
  password?: string;
  url?: string;
  totp?: string;

  // NOTE
  content?: string;

  // CARD
  cardNumber?: string;
  cardholderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  pin?: string;

  // API_KEY
  apiKey?: string;
  apiSecret?: string;
  service?: string;

  // SSH_KEY
  privateKey?: string;
  publicKey?: string;
  passphrase?: string;
  hostname?: string;

  // IDENTITY
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  passport?: string;
  nationalId?: string;
  phone?: string;
  address?: string;
}

export interface CustomField {
  label: string;
  value: string;
  type: "text" | "password" | "hidden";
}

/**
 * Encrypt a vault entry with the user's derived master key.
 * Returns the serialized encrypted string for DB storage.
 */
export async function encryptVaultEntry(
  entryData: VaultEntryData,
  masterKey: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  const payload = await encrypt(entryData, masterKey);
  return {
    encryptedData: payload.ciphertext,
    iv: payload.iv,
  };
}

/**
 * Decrypt a vault entry using the user's master key.
 */
export async function decryptVaultEntry(
  encryptedData: string,
  iv: string,
  masterKey: CryptoKey
): Promise<VaultEntryData> {
  const payload: EncryptedPayload = { iv, ciphertext: encryptedData };
  return await decrypt<VaultEntryData>(payload, masterKey);
}

/**
 * Encrypt vault-level metadata (e.g. vault name, settings).
 */
export async function encryptVaultMeta(
  meta: Record<string, unknown>,
  masterKey: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  const payload = await encrypt(meta, masterKey);
  return { encryptedData: payload.ciphertext, iv: payload.iv };
}

/**
 * Decrypt vault-level metadata.
 */
export async function decryptVaultMeta(
  encryptedData: string,
  iv: string,
  masterKey: CryptoKey
): Promise<Record<string, unknown>> {
  const payload: EncryptedPayload = { iv, ciphertext: encryptedData };
  return await decrypt<Record<string, unknown>>(payload, masterKey);
}

/**
 * Test if a master key is correct by attempting to decrypt a known payload.
 * Used to verify master password before allowing vault access.
 */
export async function verifyMasterKey(
  encryptedVerifier: string,
  masterKey: CryptoKey
): Promise<boolean> {
  try {
    const payload = deserializePayload(encryptedVerifier);
    await decrypt(payload, masterKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create an encrypted verifier token to store in the DB.
 * This is used to check if the master password is correct on unlock.
 */
export async function createMasterKeyVerifier(
  masterKey: CryptoKey
): Promise<string> {
  const verifierData = { verified: true, timestamp: Date.now() };
  const payload = await encrypt(verifierData, masterKey);
  return serializePayload(payload);
}
