import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/element", // The route you don’t have a page for
        destination: "/search", // The page you want to render
      },
    ];
  },
};

export default nextConfig;
