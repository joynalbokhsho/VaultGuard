/**
 * CLIENT-SIDE KEY DERIVATION
 * ===========================
 * Uses PBKDF2 (Web Crypto API) to derive AES-256-GCM encryption key
 * from the user's master password.
 *
 * SECURITY NOTES:
 * - PBKDF2 with SHA-512, 600,000 iterations (OWASP 2024 recommendation)
 * - 32-byte random salt stored per-user in DB (never reused)
 * - The derived CryptoKey NEVER leaves the browser
 * - The master password NEVER leaves the browser
 *
 * Why PBKDF2 over Argon2id in browser?
 * - Argon2id requires ~200KB WASM bundle; PBKDF2 is native Web Crypto
 * - PBKDF2 with 600k iterations is OWASP-recommended for this exact use case
 * - Server-side login password hashing still uses Argon2id (via Better Auth)
 */

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_HASH = "SHA-512";
const KEY_LENGTH = 256; // bits

/**
 * Generate a random 32-byte salt for key derivation.
 * Call once during vault creation; store the base64 result in DB.
 */
export function generateKdfSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  return uint8ArrayToBase64(salt);
}

/**
 * Derive an AES-256-GCM CryptoKey from the master password.
 * This is the core of the zero-knowledge architecture.
 *
 * @param masterPassword - Raw master password (never leaves browser)
 * @param saltBase64 - Base64-encoded salt from database
 * @returns CryptoKey (AES-256-GCM) — stays in memory only
 */
export async function deriveMasterKey(
  masterPassword: string,
  saltBase64: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);
  const saltBytes = base64ToUint8Array(saltBase64);

  // Import the raw password as a base key
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes.buffer as ArrayBuffer,
    { name: "PBKDF2" },
    false, // not extractable
    ["deriveKey"]
  );

  // Derive the actual AES-GCM key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    false, // NOT extractable — key cannot be read from memory
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

/**
 * Derive a verification token from the master password.
 * This allows checking if the master password is correct WITHOUT
 * storing the master password or encryption key on the server.
 *
 * The verifier is: PBKDF2(masterPassword, salt + "verify", 1)
 * Stored in DB; compared client-side to verify master password.
 */
export async function deriveMasterKeyVerifier(
  masterPassword: string,
  saltBase64: string
): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);
  const saltBytes = base64ToUint8Array(saltBase64);

  // Use a different salt for the verifier (append "verify" prefix)
  const verifierSalt = new Uint8Array(saltBytes.length + 6);
  verifierSalt.set(saltBytes);
  verifierSalt.set(encoder.encode("verify"), saltBytes.length);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const verifierBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: verifierSalt,
      iterations: 100_000, // lower iterations ok since this isn't the encryption key
      hash: "SHA-256",
    },
    baseKey,
    256
  );

  return uint8ArrayToBase64(new Uint8Array(verifierBits));
}

// --- Utility functions ---

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
