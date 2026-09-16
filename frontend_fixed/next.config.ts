import type { NextConfig } from "next";

const backend =
  process.env.DJANGO_PUBLIC_URL ||
  "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backend}/api/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${backend}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;