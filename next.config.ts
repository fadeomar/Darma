import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this project directory. Without this,
  // Next 16 can mis-infer the root and crash with a Turbopack panic
  // ("couldn't find next/package.json from .../src/app").
  turbopack: {
    root: path.resolve(process.cwd()),
  },
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
