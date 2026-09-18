import type { NextConfig } from "next";

const DJANGO =
  process.env.DJANGO_INTERNAL_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  trailingSlash: true,

  async rewrites() {
    return [
      {
        source: "/static/:path*",
        destination: `${DJANGO}/static/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${DJANGO}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;