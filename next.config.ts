import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
            "img-src 'self' blob: data: https://skies.esac.esa.int",
      "media-src 'self' blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
  ...(process.env.VERCEL
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  // Une seule page 404 pour tout le site (il a plusieurs mises en page racines).
  experimental: { globalNotFound: true },
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [{ source: "/apple-icon", destination: "/apple-icon.png" }];
  },
  async redirects() {
    return [
      // À propos et Contact vivent désormais dans les paramètres.
      { source: "/a-propos", destination: "/?parametres=apropos", permanent: false },
      { source: "/contact", destination: "/?parametres=contact", permanent: false },
      { source: "/odyssee-test", destination: "/aakanos", permanent: false },
      { source: "/nouveau", destination: "/", permanent: false },
      {
        source: "/:path*",
        has: [{ type: "host", value: "franckjhchristenhmbk.vercel.app" }],
        destination: "https://franckjhchristen.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
