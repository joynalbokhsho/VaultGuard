/**
 * CLIENT-SIDE AES-256-GCM ENCRYPTION
 * ====================================
 * All encryption/decryption happens in the browser using Web Crypto API.
 * The server NEVER receives plaintext data.
 *
 * SECURITY NOTES:
 * - AES-256-GCM provides both confidentiality AND authenticity
 * - Unique 96-bit (12-byte) IV generated for EVERY encryption operation
 * - GCM authentication tag prevents tampering
 * - Data is base64-encoded for safe transport/storage
 */

import { uint8ArrayToBase64, base64ToUint8Array } from "./keyDerivation";

const IV_LENGTH = 12; // 96 bits — recommended for AES-GCM

export interface EncryptedPayload {
  iv: string;        // Base64-encoded IV
  ciphertext: string; // Base64-encoded encrypted data + auth tag
}

/**
 * Encrypt arbitrary data with AES-256-GCM.
 *
 * @param data - Any serializable data (will be JSON-stringified)
 * @param key - CryptoKey from deriveMasterKey()
 * @returns EncryptedPayload with base64 IV and ciphertext
 */
export async function encrypt(
  data: unknown,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Generate a fresh random IV for every encryption
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  return {
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
  };
}

/**
 * Decrypt AES-256-GCM encrypted data.
 *
 * @param payload - EncryptedPayload from encrypt()
 * @param key - CryptoKey from deriveMasterKey()
 * @returns Decrypted and parsed data
 * @throws If key is wrong or data was tampered with (GCM auth fails)
 */
export async function decrypt<T = unknown>(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<T> {
  const iv = base64ToUint8Array(payload.iv);
  const ciphertext = base64ToUint8Array(payload.ciphertext);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  const plaintext = decoder.decode(plaintextBuffer);
  return JSON.parse(plaintext) as T;
}

/**
 * Encrypt a string directly (without JSON wrapping).
 * Used for encrypting individual fields.
 */
export async function encryptString(
  text: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(text);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  return {
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
  };
}

/**
 * Decrypt a string encrypted with encryptString().
 */
export async function decryptString(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const iv = base64ToUint8Array(payload.iv);
  const ciphertext = base64ToUint8Array(payload.ciphertext);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

/**
 * Serialize an EncryptedPayload to a single base64 string for DB storage.
 * Format: base64(iv) + ":" + base64(ciphertext)
 */
export function serializePayload(payload: EncryptedPayload): string {
  return `${payload.iv}:${payload.ciphertext}`;
}

/**
 * Deserialize a stored encrypted string back to EncryptedPayload.
 */
export function deserializePayload(serialized: string): EncryptedPayload {
  const colonIndex = serialized.indexOf(":");
  return {
    iv: serialized.substring(0, colonIndex),
    ciphertext: serialized.substring(colonIndex + 1),
  };
}
