import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.justinmind.com",
        port: "", // Leave empty unless a specific port is used
        pathname: "/**", // Allows all paths under this domain
      },
    ],
  },
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
