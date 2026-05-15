import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor, emailOTP } from "better-auth/plugins";
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
<body style="margin:0;padding:0;background-color:#020205;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#020205;padding:60px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#0b0b12;border:1px solid #1a1a2e;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.4);">
          
          <!-- Glossy Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);padding:48px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.12);padding:12px;border-radius:14px;margin-bottom:20px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h2 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;text-shadow:0 2px 4px rgba(0,0,0,0.1);">${APP_NAME}</h2>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:48px 40px;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;">${title}</h1>
              <div style="font-size:16px;line-height:1.6;color:#94a3b8;">
                ${bodyHtml}
              </div>
            </td>
          </tr>

          <!-- Safety Banner -->
          <tr>
            <td style="padding:0 40px 48px;">
              <div style="background-color:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:24px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
                  <strong>Zero-Knowledge Security</strong><br/>
                  Your vault is encrypted with your master password before it leaves your device. We can never see your data.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#08080f;padding:32px 40px;text-align:center;border-top:1px solid #1a1a2e;">
              <p style="margin:0;font-size:12px;color:#475569;letter-spacing:0.02em;">
                © ${new Date().getFullYear()} ${APP_NAME} Systems · All rights reserved.<br/>
                <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;font-weight:600;display:inline-block;margin-top:8px;">Visit Website</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>\`;
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
    throw new Error(\`Email delivery failed: \${result.error.message}\`);
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
        subject: \`Reset your \${APP_NAME} password\`,
        html: emailTemplate(
          "Reset your password",
            \`<p style="margin:0 0 24px;">We received a request to reset your \${APP_NAME} account password. Click the button below to secure your vault with a new passphrase.</p>
             <div style="text-align:center;margin:32px 0;">
               <a href="\${url}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);color:#ffffff;font-weight:700;font-size:15px;border-radius:12px;text-decoration:none;box-shadow:0 10px 20px rgba(79, 70, 229, 0.2);">Reset Your Password</a>
             </div>
             <p style="margin:0;font-size:13px;color:#475569;">If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>\`
        ),
      });
    },
  },

  // --- Email Verification ---
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: \`Verify your \${APP_NAME} email address\`,
        html: emailTemplate(
          "Verify your email",
            \`<p style="margin:0 0 24px;">Thank you for choosing VaultGuard. To finish setting up your account and activate your encrypted storage, please verify your email address below.</p>
             <div style="text-align:center;margin:32px 0;">
               <a href="\${url}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);color:#ffffff;font-weight:700;font-size:15px;border-radius:12px;text-decoration:none;box-shadow:0 10px 20px rgba(79, 70, 229, 0.2);">Verify Email Address</a>
             </div>
             <p style="margin:0;font-size:13px;color:#475569;">If you did not create a \${APP_NAME} account, you can safely ignore this email.</p>\`
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

  // --- User Fields ---
  user: {
    additionalFields: {
      twoFactorEmailEnabled: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },

  // --- Plugins ---
  plugins: [
    emailOTP({
      async sendVerificationCode({ user, code }) {
        if ((user as any).twoFactorEmailEnabled === false) {
          console.log("[Auth] Email 2FA skipped: disabled for user", user.email);
          return;
        }
        await sendEmail({
          to: user.email,
          subject: \`Your \${APP_NAME} 2FA Code\`,
          html: emailTemplate(
            "Two-Factor Authentication",
            \`<p style="margin:0 0 24px;">Use the verification code below to complete your sign-in. For your security, this code will expire in 10 minutes.</p>
             <div style="text-align:center;margin:40px 0;">
               <div style="display:inline-block;padding:20px 48px;background-color:#020205;border:2px solid #4f46e5;color:#ffffff;font-size:36px;font-weight:800;letter-spacing:10px;border-radius:16px;box-shadow:0 0 30px rgba(79, 70, 229, 0.1);">\${code}</div>
             </div>
             <p style="margin:0;font-size:13px;color:#475569;">If you didn't request this code, please secure your account by changing your login password immediately.</p>\`
          ),
        });
      },
    }),
    twoFactor({
      issuer: APP_NAME,
      otpOptions: {
        period: 30,
        digits: 6,
      },
    }),
    passkey({
      rpID: process.env.NODE_ENV === "production" ? "vault.diu.my.id" : "localhost",
      rpName: APP_NAME,
    }),
  ],
});

export type Auth = typeof auth;
