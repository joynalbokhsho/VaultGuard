import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security: prevent information leakage
  poweredByHeader: false,

  // Strict mode for catching React issues early
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Experimental features
  experimental: {
    // Server Actions (needed for Better Auth)
    serverActions: {
      allowedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      ],
    },
  },

  // Additional headers (fallback for Vercel — middleware also sets these)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
