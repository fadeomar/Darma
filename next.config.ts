import type { NextConfig } from "next";
import path from "node:path";

// Browser-only stub for the Node built-ins referenced by the Piper/ONNX WASM
// glue behind /tools/text-to-speech. See src/lib/emptyNodeModule.js.
const emptyNodeModule = "./src/lib/emptyNodeModule.js";

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this project directory. Without this,
  // Next 16 can mis-infer the root and crash with a Turbopack panic
  // ("couldn't find next/package.json from .../src/app").
  turbopack: {
    root: path.resolve(process.cwd()),
    // The Piper/ONNX WASM glue behind /tools/text-to-speech ships an Emscripten
    // bundle with a dead `ENVIRONMENT_IS_NODE` branch. It never runs in a
    // browser, but the bundler still resolves its `require()` calls, so these
    // are stubbed for the browser condition only - server code is unaffected.
    // Kept project-relative: Turbopack resolves these against `turbopack.root`
    // above, so it works on Vercel (/vercel/path0) and Windows alike. An
    // absolute `path.resolve()` value breaks the Vercel build.
    resolveAlias: {
      fs: { browser: emptyNodeModule },
      path: { browser: emptyNodeModule },
      crypto: { browser: emptyNodeModule },
    },
  },
  outputFileTracingIncludes: {
    "/*": [
      "./content/explorer/manifest.json",
      "./content/explorer/catalog.json",
      "./content/explorer/items/**/*.json",
    ],
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
        source: "/element",
        destination: "/", // Rewrite /element to home page
      },
    ];
  },
};

export default nextConfig;
