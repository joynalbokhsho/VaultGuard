import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@/lib/db/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "VaultGuard";
const APP_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

// ─── Shared email HTML wrapper ────────────────────────────────────────────────
function emailTemplate(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#09090f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#111120;border:1px solid #282840;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;display:inline-block;line-height:40px;text-align:center;font-size:22px;">🔐</div>
                <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">${APP_NAME}</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f0eeff;">${title}</h1>
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #282840;text-align:center;">
              <p style="margin:0;font-size:12px;color:#4b4b6b;">
                🔒 End-to-end encrypted · Your master password never leaves your device<br/>
                <a href="${APP_URL}" style="color:#7c3aed;text-decoration:none;">${APP_URL}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Helper to safely send and log errors ────────────────────────────────────
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const result = await resend.emails.send({ from: FROM, to, subject, html });
  if (result.error) {
    console.error("[Resend] Failed to send email:", result.error);
    throw new Error(`Email delivery failed: ${result.error.message}`);
  }
  console.log("[Resend] Email sent to", to, "| id:", result.data?.id);
}

// ─── Auth config ─────────────────────────────────────────────────────────────
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // --- Email & Password ---
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // set true once your domain is verified in Resend
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: `Reset your ${APP_NAME} password`,
        html: emailTemplate(
          "Reset your password",
          `<p style="color:#9c99bc;font-size:15px;line-height:1.7;margin:0 0 24px;">
            We received a request to reset the password for your ${APP_NAME} account.
            Click the button below to choose a new password.
           </p>
           <div style="text-align:center;margin:28px 0;">
             <a href="${url}" style="display:inline-block;padding:14px 32px;background:#7c3aed;color:#fff;font-weight:600;font-size:15px;border-radius:10px;text-decoration:none;">
               Reset Password
             </a>
           </div>
           <p style="color:#4b4b6b;font-size:12px;margin:0;">
             This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
           </p>`
        ),
      });
    },
  },

  // --- Email Verification ---
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: `Verify your ${APP_NAME} email address`,
        html: emailTemplate(
          "Verify your email",
          `<p style="color:#9c99bc;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Thanks for signing up! Please verify your email address to activate your vault.
           </p>
           <div style="text-align:center;margin:28px 0;">
             <a href="${url}" style="display:inline-block;padding:14px 32px;background:#7c3aed;color:#fff;font-weight:600;font-size:15px;border-radius:10px;text-decoration:none;">
               Verify Email Address
             </a>
           </div>
           <p style="color:#4b4b6b;font-size:12px;margin:0;">
             If you did not create a ${APP_NAME} account, you can safely ignore this email.
           </p>`
        ),
      });
    },
    sendOnSignUp: false, // change to true when requireEmailVerification is enabled
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
      issuer: APP_NAME,
      otpOptions: {
        period: 30,
        digits: 6,
      },
    }),
    passkey(),
  ],
});

export type Auth = typeof auth;
