import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/search",
        destination: "/", // Rewrite /search to home page
      },
      {
        source: "/element",
        destination: "/", // Rewrite /element to home page
      },
      {
        source: "/search/:slug",
        destination: "/", // Rewrite /search/[slug] to home page
      },
    ];
  },
};

export default nextConfig;
