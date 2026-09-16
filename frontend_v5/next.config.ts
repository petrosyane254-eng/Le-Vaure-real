import type { NextConfig } from "next";

const DJANGO =
  process.env.DJANGO_INTERNAL_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/southward-control-7x9/:path*",
        destination: `${DJANGO}/southward-control-7x9/:path*`,
      },
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