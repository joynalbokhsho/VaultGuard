import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VaultGuard — Zero-Knowledge Password Manager",
    template: "%s | VaultGuard",
  },
  description:
    "Military-grade zero-knowledge password manager. Your passwords are encrypted in your browser before reaching our servers — we literally cannot see your data.",
  keywords: [
    "password manager",
    "zero-knowledge",
    "AES-256",
    "end-to-end encrypted",
    "secure vault",
    "2FA",
  ],
  authors: [{ name: "VaultGuard" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "VaultGuard — Zero-Knowledge Password Manager",
    description: "Your passwords, encrypted in your browser. We can't see them. Nobody can.",
    siteName: "VaultGuard",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Prevent FOUC: Set dark class before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('vaultguard-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="vaultguard-theme"
        >
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgb(17 17 32)",
                color: "rgb(240 238 255)",
                border: "1px solid rgb(40 38 65)",
                fontFamily: "'Inter', system-ui, sans-serif",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
