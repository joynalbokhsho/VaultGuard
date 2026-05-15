import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { Geist, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
    <html lang="en" suppressHydrationWarning className={cn("dark", geistSans.variable, jetbrainsMono.variable)}>
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
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="vaultguard-theme"
        >
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" closeButton richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
