import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
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
