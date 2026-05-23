import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.examnurture.com" },
      { protocol: "https", hostname: "**.examnurture.in" },
    ],
  },

  async redirects() {
    return [
      // Redirect alternate domains → canonical examnurture.com (preserves path + query)
      {
        source: "/:path*",
        has: [{ type: "host", value: "examnurture.in" }],
        destination: "https://examnurture.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.examnurture.in" }],
        destination: "https://examnurture.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "examnurture.org" }],
        destination: "https://examnurture.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.examnurture.org" }],
        destination: "https://examnurture.com/:path*",
        permanent: true,
      },
      // Redirect www → non-www canonical
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.examnurture.com" }],
        destination: "https://examnurture.com/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
