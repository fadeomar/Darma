import type { NextConfig } from "next";
import path from "node:path";

// Browser-only stub for the Node built-ins referenced by the Piper/ONNX WASM
// glue behind /tools/text-to-speech. See src/lib/emptyNodeModule.js.
// Forward slashes: Turbopack does not resolve Windows-style `C:\...` aliases.
const emptyNodeModule = path.resolve(process.cwd(), "src/lib/emptyNodeModule.js").replace(/\\/g, "/");

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this project directory. Without this,
  // Next 16 can mis-infer the root and crash with a Turbopack panic
  // ("couldn't find next/package.json from .../src/app").
  turbopack: {
    root: path.resolve(process.cwd()),
    // The Piper/ONNX WASM glue behind /tools/text-to-speech ships an Emscripten
    // bundle with a dead `ENVIRONMENT_IS_NODE` branch. It never runs in a
    // browser, but the bundler still resolves its `require()` calls, so these
    // are stubbed for the browser condition only — server code is unaffected.
    // Resolved to an absolute path on purpose: a relative or tsconfig-aliased
    // specifier here is resolved against the *importing* module (deep inside
    // node_modules), so it silently fails to match.
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
