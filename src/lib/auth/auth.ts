import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@/lib/db/prisma";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // --- Email & Password ---
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, 
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // --- Session Configuration ---
  session: {
    expiresIn: 60 * 60 * 24 * 7,       // 7 days
    updateAge: 60 * 60 * 24,            // Refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                   // 5 minute cookie cache
    },
  },

  // --- Cookie Security ---
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "vaultguard",
    crossSubDomainCookies: {
      enabled: false,
    },
  },

  // --- Plugins ---
  plugins: [
    twoFactor({
      issuer: "VaultGuard",
      otpOptions: {
        period: 30,
        digits: 6,
      },
    }),
    passkey(),
  ],

  // --- Email sending (for verification/reset) ---
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: user.email,
        subject: "Verify your VaultGuard email",
        html: `<p>Please verify your email by clicking <a href="${url}">this link</a>.</p>`,
      });
    },
  },
});

export type Auth = typeof auth;
