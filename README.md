<div align="center">

# 🔐 VaultGuard

**A production-grade, zero-knowledge password manager built with Next.js 15**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/joynalbokhsho/VaultGuard?style=social)](https://github.com/joynalbokhsho/VaultGuard)
[![GitHub Forks](https://img.shields.io/github/forks/joynalbokhsho/VaultGuard?style=social)](https://github.com/joynalbokhsho/VaultGuard/fork)

*Your passwords are encrypted in your browser before they ever reach our servers — we literally cannot read them.*

</div>

---

## Table of Contents

- [Overview](#overview)
- [Security Architecture](#security-architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Cryptography Deep Dive](#cryptography-deep-dive)
- [Admin Panel](#admin-panel)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

VaultGuard is a **self-hostable**, **end-to-end encrypted** password manager. Unlike traditional password managers where the server *could* theoretically decrypt your data, VaultGuard enforces a strict **zero-knowledge architecture** — every secret is encrypted client-side using the Web Crypto API before any network request is made.

The server stores only ciphertext. Even with full database access, an attacker cannot read your vault.

---

## Security Architecture

### Zero-Knowledge Encryption Flow

```
User types Master Password
         │
         ▼
PBKDF2-SHA512 (600,000 iterations)  ←── KDF Salt (stored on server)
         │
         ▼
    Master Key (CryptoKey)  ←── Never leaves the browser. Lives only in JS heap memory.
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Encrypt    Decrypt
Entries    Entries
(AES-256-GCM)
    │
    ▼
Ciphertext + IV  ──► Sent to server / stored in DB
```

### Key Security Properties

| Property | Implementation |
|---|---|
| **Encryption Algorithm** | AES-256-GCM (authenticated encryption) |
| **Key Derivation** | PBKDF2-SHA512 with 600,000 iterations |
| **Master Key Storage** | Browser memory only (non-extractable `CryptoKey`) — never persisted |
| **Per-Entry IVs** | Each vault entry is encrypted with a unique 96-bit random IV |
| **Server Blind** | The server stores only `encryptedData` + `iv` + `kdfSalt` — zero plaintext |
| **2FA Secrets** | TOTP secrets and backup codes are encrypted before database storage |
| **Recovery Codes** | Hashed with Argon2id — server only stores hashes, never plaintext codes |
| **Session Management** | Handled by Better Auth with secure, HttpOnly session cookies |
| **Rate Limiting** | Per-IP rate limits on all sensitive endpoints (Upstash Redis or in-memory) |
| **Inactivity Lock** | Vault auto-locks after 15 minutes of user inactivity, wiping the key from memory |

### What the server NEVER sees
- Your master password (not even a hash)
- Decrypted vault entries, titles, usernames, or passwords
- Plaintext 2FA secrets or recovery codes

---

## Features

### 🔑 Vault
- Store **6 types of secrets**: Logins, Secure Notes, Bank Cards, API Keys, SSH Keys, and Identity profiles
- **AES-256-GCM** encryption — each entry encrypted individually with a unique IV
- Full-text search across decrypted entries (client-side only)
- Filter by category or mark entries as **Favorites**
- Copy passwords / usernames to clipboard with a single click
- Reveal/hide password fields

### 🔐 Authentication
- Email + password login (login password is separate from the master password)
- **Passkey / WebAuthn** login (biometrics, hardware keys)
- **TOTP Two-Factor Authentication** (Google Authenticator, Authy, etc.)
- Encrypted backup codes for 2FA recovery
- Session management — view and revoke active sessions
- Inactivity auto-lock with a live countdown timer

### 🛡️ Security
- Zero-knowledge architecture by design
- Automatic vault lock after 15 minutes of inactivity (configurable)
- Audit log of all security-sensitive events (login, unlock, entry changes)
- Rate limiting on all API endpoints
- DOMPurify sanitisation on all user inputs
- CSRF protection
- Device fingerprinting and trusted device tracking

### 🔑 Password Generator
- Cryptographically secure password generator (`crypto.getRandomValues`)
- Configurable: length, uppercase, lowercase, numbers, symbols
- Passphrase generator mode
- zxcvbn strength meter

### 🏥 Recovery
- Account recovery via encrypted recovery codes
- 2FA disable with backup code

### 🛠️ Admin Panel
- User management (view, role assignment)
- Audit log viewer
- Platform statistics

### 📱 UX
- Fully **mobile-responsive** with a toggleable sidebar drawer
- Dark-mode UI with glassmorphism accents
- Smooth animations via Framer Motion
- Toast notifications (Sonner)
- Accessible — keyboard navigable, proper ARIA labels

---

## Tech Stack

### Core
| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org) |
| **Language** | [TypeScript 5](https://typescriptlang.org) |
| **Database ORM** | [Prisma 7](https://prisma.io) |
| **Database** | PostgreSQL (tested with [Supabase](https://supabase.com)) |
| **Authentication** | [Better Auth](https://better-auth.com) |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs) |
| **Styling** | Tailwind CSS 4 + Vanilla CSS |

### Security & Cryptography
| Purpose | Library / API |
|---|---|
| **Encryption / Decryption** | Web Crypto API (`crypto.subtle`) — browser-native |
| **Key Derivation** | PBKDF2-SHA512 via `crypto.subtle.deriveBits` |
| **Password Strength** | [zxcvbn](https://github.com/dropbox/zxcvbn) |
| **TOTP 2FA** | [otplib](https://github.com/yeojz/otplib) |
| **QR Code** | [qrcode](https://github.com/soldair/node-qrcode) |
| **Passkey / WebAuthn** | [@simplewebauthn](https://simplewebauthn.dev) + [@better-auth/passkey](https://better-auth.com) |
| **Input Sanitisation** | [DOMPurify](https://github.com/cure53/DOMPurify) |
| **Rate Limiting** | [Upstash Redis](https://upstash.com) (optional) or in-memory |

### UI
| Purpose | Library |
|---|---|
| **Icons** | [Lucide React](https://lucide.dev) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **UI Primitives** | [Radix UI](https://radix-ui.com) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Toasts** | [Sonner](https://sonner.emilkowal.ski) |
| **Email** | [Resend](https://resend.com) |

---

## Project Structure

```
vaultguard/
├── prisma/
│   └── schema.prisma         # Database schema (Prisma)
├── scripts/
│   └── make-admin.mjs        # CLI script to promote a user to admin
├── src/
│   ├── app/
│   │   ├── (auth)/           # Public auth pages (login, register)
│   │   ├── (dashboard)/      # Protected dashboard routes
│   │   │   ├── 2fa/          # 2FA setup & management
│   │   │   ├── admin/        # Admin panel (users, audit logs)
│   │   │   ├── generator/    # Password generator tool
│   │   │   ├── recovery/     # Account recovery
│   │   │   ├── sessions/     # Session management
│   │   │   ├── settings/     # User settings
│   │   │   └── vault/        # Main vault dashboard
│   │   ├── api/              # API route handlers
│   │   │   ├── admin/        # Admin-only endpoints
│   │   │   ├── audit/        # Audit log API
│   │   │   ├── auth/         # Better Auth handler
│   │   │   ├── entries/      # Vault entry CRUD
│   │   │   ├── recovery/     # Recovery code endpoints
│   │   │   ├── sessions/     # Session management API
│   │   │   └── vault/        # Vault metadata API
│   │   ├── globals.css
│   │   ├── layout.tsx        # Root layout (fonts, providers)
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── auth/             # LoginForm, RegisterForm
│   │   ├── layout/           # Sidebar, DashboardNavbar
│   │   └── vault/            # VaultDashboard, EntryList, PasswordModal, etc.
│   ├── hooks/
│   │   ├── useInactivityTimer.ts  # Live countdown — seconds left before auto-lock
│   │   ├── useInactivityLock.ts   # Triggers vault.lockVault() on timer expiry
│   │   └── useCopyWithClear.ts    # Copy to clipboard, auto-clears after N seconds
│   ├── lib/
│   │   ├── auth/             # Better Auth config (server + client)
│   │   ├── crypto/
│   │   │   ├── encryption.ts    # AES-256-GCM encrypt/decrypt
│   │   │   ├── keyDerivation.ts # PBKDF2-SHA512 master key derivation
│   │   │   └── vault.ts         # Vault-level crypto operations
│   │   ├── db/
│   │   │   └── prisma.ts        # Prisma client singleton
│   │   ├── security/
│   │   │   ├── audit.ts         # Audit log helpers
│   │   │   ├── rateLimit.ts     # Rate limiting middleware
│   │   │   └── sanitize.ts      # DOMPurify input sanitisation
│   │   └── validations/
│   │       └── schemas.ts       # Zod validation schemas
│   ├── store/
│   │   └── vaultStore.ts     # Zustand store (master key in memory)
│   └── proxy.ts              # Middleware (auth guards, redirects)
├── .env.example              # Environment variable template
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Database Schema

VaultGuard uses PostgreSQL. Here is a summary of the key models:

| Model | Purpose |
|---|---|
| `User` | Core user account — holds KDF salt, role, 2FA flag |
| `Account` | OAuth / credential provider records (Better Auth) |
| `Session` | Active user sessions with IP + UA tracking |
| `Vault` | Per-user encrypted vault metadata blob |
| `EncryptedEntry` | Individual encrypted vault entries (AES-256-GCM) |
| `TwoFactor` | Encrypted TOTP secret + backup codes |
| `RecoveryCode` | Argon2id-hashed account recovery codes |
| `AuditLog` | Immutable security event log |
| `Device` | Trusted device fingerprints |

> **Important:** The `encryptedData` column of `Vault` and `EncryptedEntry` always contains opaque ciphertext. The schema is designed so that database-level access provides no information about vault contents.

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and **npm** 10+
- **PostgreSQL** database (local or [Supabase](https://supabase.com) — free tier works)
- **Resend** account (for email — free tier works)
- **Upstash Redis** (optional — for distributed rate limiting)

### 1. Clone the repository

```bash
git clone https://github.com/joynalbokhsho/VaultGuard.git
cd VaultGuard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all required values. See [Environment Variables](#environment-variables) for details.

### 4. Set up the database

```bash
# Push the schema to your database
npx prisma db push

# Generate the Prisma client
npx prisma generate
```

### 5. (Optional) Create an admin user

First register a normal account via the app, then run:

```bash
node scripts/make-admin.mjs
# You will be prompted to enter the email address
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# ── Database ─────────────────────────────────────────────────
# PostgreSQL connection string (Supabase recommended)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# ── Better Auth ───────────────────────────────────────────────
# Generate: openssl rand -hex 32
BETTER_AUTH_SECRET="your-32-char-minimum-secret"
BETTER_AUTH_URL="http://localhost:3000"   # Change to your domain in production

# ── App ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="VaultGuard"

# ── Email (Resend) ────────────────────────────────────────────
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# ── Rate Limiting (optional) ──────────────────────────────────
# Leave empty to fall back to in-memory rate limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# ── Security ──────────────────────────────────────────────────
# Generate: openssl rand -hex 32
CSRF_SECRET="your-csrf-secret"

# ── HaveIBeenPwned (optional) ─────────────────────────────────
HIBP_API_KEY=""
```

> ⚠️ **Never commit your `.env` file.** It is already in `.gitignore`. Only commit `.env.example`.

---

## API Reference

All API routes are under `/api/`. Protected routes require an active session cookie.

### Vault

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/vault` | ✅ | Fetch vault metadata |
| `POST` | `/api/vault` | ✅ | Create vault (on registration) |

### Entries

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/entries` | ✅ | List all encrypted entries |
| `POST` | `/api/entries` | ✅ | Create a new encrypted entry |
| `PUT` | `/api/entries/[id]` | ✅ | Update an entry |
| `DELETE` | `/api/entries/[id]` | ✅ | Delete an entry |

### Sessions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sessions` | ✅ | List all active sessions |
| `DELETE` | `/api/sessions` | ✅ | Revoke a session |

### Recovery

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/recovery` | ✅ | Check recovery code status |
| `POST` | `/api/recovery` | ✅ | Generate new recovery codes |

### Audit

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/audit` | ✅ | Fetch your audit log |

### Admin (role = `admin` only)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | 🔒 Admin | List all users |
| `GET` | `/api/admin/stats` | 🔒 Admin | Platform statistics |
| `GET` | `/api/admin/audit` | 🔒 Admin | Platform-wide audit log |

---

## Authentication

VaultGuard uses [Better Auth](https://better-auth.com) for all authentication flows. This includes:

- **Email/password** registration and login
- **Session management** with secure HttpOnly cookies
- **Passkey / WebAuthn** via `@better-auth/passkey` and `@simplewebauthn`
- **TOTP 2FA** via `better-auth/plugins/two-factor` and `otplib`

### The Two-Password System

VaultGuard uses **two separate passwords** for different purposes:

| Password | Purpose | Sent to server? |
|---|---|---|
| **Login Password** | Authenticates your identity (standard auth) | Yes (hashed server-side) |
| **Master Password** | Derives your encryption key in-browser | **Never** |

This means even if your account is compromised, the attacker still cannot read your vault without your master password.

---

## Cryptography Deep Dive

### Key Derivation (`src/lib/crypto/keyDerivation.ts`)

```
Master Password (string)
        +
KDF Salt (32 random bytes, stored on server as Base64)
        │
        ▼
PBKDF2-SHA512
  iterations: 600,000
  keyLength:  256 bits
        │
        ▼
Master Key (CryptoKey, non-extractable)
```

The KDF salt is generated once on registration and stored in the `User.kdfSalt` column. It is **not secret** — it just prevents rainbow table attacks.

### Entry Encryption (`src/lib/crypto/encryption.ts`)

```
Plaintext Entry (JSON string)
        +
Master Key (CryptoKey)
        +
IV (12 random bytes, unique per entry)
        │
        ▼
AES-256-GCM encrypt (crypto.subtle.encrypt)
        │
        ▼
{ encryptedData: Base64, iv: Base64 }  ──► stored in DB
```

Each entry gets its own randomly generated IV. The GCM authentication tag (included in the output) guarantees both confidentiality and integrity — tampered ciphertext will fail to decrypt.

### Master Key in Memory

The derived `CryptoKey` is stored in a Zustand store **without persistence**:
- It exists only in the JavaScript heap
- It is **non-extractable** — you cannot call `crypto.subtle.exportKey` on it
- It is cleared on vault lock, logout, session expiry, or browser refresh
- The inactivity timer hook wipes it after 15 minutes of no user interaction

---

## Admin Panel

To access the admin panel at `/admin`, your account must have `role = "admin"` in the database.

### Granting Admin Access

```bash
node scripts/make-admin.mjs your@email.com
```

This script directly updates the `User.role` field in the database.

### Admin Capabilities
- **User Management**: View all registered users, see their 2FA status, account creation date
- **Audit Logs**: Platform-wide security event log with IP addresses and user agents
- **Statistics**: Total users, vaults, entries

---

## Deployment

### Vercel (Recommended)

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain
5. Run database migrations: `npx prisma db push`

### Self-Hosted (Docker)

A `docker-compose.yml` is included for running the app + PostgreSQL locally:

```bash
# Copy and configure your environment
cp .env.example .env

# Start services
docker compose up -d
```

> ⚠️ **Set `POSTGRES_PASSWORD` in your `.env`** before running Docker in production. The default fallback `changeme` in `docker-compose.yml` is a placeholder only.

### Self-Hosted (VPS / Node)

```bash
npm run build
npm start
```

Requirements:
- Node.js 20+
- A running PostgreSQL instance
- All environment variables set in `.env`

### Production Checklist

- [ ] `BETTER_AUTH_SECRET` is at least 32 random characters — generate: `openssl rand -hex 32`
- [ ] `CSRF_SECRET` is set — generate: `openssl rand -hex 32`
- [ ] `DATABASE_URL` points to your **production** database (not dev/local)
- [ ] `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are your HTTPS domain (no trailing slash)
- [ ] `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured for email delivery
- [ ] `POSTGRES_PASSWORD` is a strong, unique password (if using Docker)
- [ ] Upstash Redis is configured for distributed rate limiting across instances
- [ ] HTTPS / TLS is enforced — **required** for WebAuthn / Passkeys to function
- [ ] Run `npx prisma db push` against your production database before first boot
- [ ] Confirm `.env` is **not** in your git history (`git log --all -- .env`)

---

## Contributing

Contributions are very welcome! Here's how to get started:

1. **Fork** the repository on GitHub
2. Clone your fork: `git clone https://github.com/your-username/VaultGuard.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes and ensure the build passes: `npm run build`
5. Commit with a descriptive message: `git commit -m "feat: add your feature"`
6. Push and open a **Pull Request** against `master`

### Guidelines
- Follow the existing TypeScript code style and naming conventions
- **Maintain the zero-knowledge guarantee** — no plaintext secrets should ever leave the browser or be stored server-side
- Add JSDoc comments to any cryptographic code
- Test on both desktop and mobile screen sizes
- Do not introduce new dependencies without discussion in the PR

### Good First Issues
- Improving accessibility (ARIA, keyboard navigation)
- Adding more vault entry types
- Improving the password generator wordlist
- Writing integration tests

---

## License

[MIT](LICENSE) — free to use, modify, and self-host.

---

<div align="center">

Built with ❤️ and a deep respect for privacy.

*Your data is yours. Always.*

</div>
