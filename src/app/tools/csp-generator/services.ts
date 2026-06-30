import type { CspDirectiveName } from "./types";

export type CspServiceAddition = {
  directive: CspDirectiveName;
  sources: string[];
};

export type CspServiceDefinition = {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Directive sources this service appends when enabled. */
  additions: CspServiceAddition[];
  /** Optional note shown when the service is enabled. */
  note?: string;
};

/**
 * Common third-party services a typical web app needs to allow.
 * Each one maps to a small set of CSP directive sources so a
 * non-expert can enable an integration without knowing the domains.
 */
export const CSP_SERVICES: readonly CspServiceDefinition[] = [
  {
    id: "google-fonts",
    label: "Google Fonts",
    icon: "🔤",
    description: "Self-hosted look with Google's font CDN.",
    additions: [
      { directive: "style-src", sources: ["https://fonts.googleapis.com"] },
      { directive: "font-src", sources: ["https://fonts.gstatic.com"] },
    ],
  },
  {
    id: "google-analytics",
    label: "Google Analytics",
    icon: "📊",
    description: "GA4 / Google Tag Manager tracking.",
    additions: [
      { directive: "script-src", sources: ["https://www.googletagmanager.com", "https://www.google-analytics.com"] },
      { directive: "connect-src", sources: ["https://www.google-analytics.com", "https://www.googletagmanager.com"] },
      { directive: "img-src", sources: ["https://www.google-analytics.com"] },
    ],
  },
  {
    id: "youtube",
    label: "YouTube embeds",
    icon: "▶️",
    description: "Embedded YouTube players and thumbnails.",
    additions: [
      { directive: "frame-src", sources: ["https://www.youtube.com", "https://www.youtube-nocookie.com"] },
      { directive: "img-src", sources: ["https://i.ytimg.com"] },
    ],
  },
  {
    id: "vercel",
    label: "Vercel / Next.js",
    icon: "▲",
    description: "Vercel Analytics, Speed Insights, and Live.",
    additions: [
      { directive: "script-src", sources: ["https://va.vercel-scripts.com"] },
      { directive: "connect-src", sources: ["https://vitals.vercel-insights.com", "https://vercel.live"] },
    ],
  },
  {
    id: "stripe",
    label: "Stripe",
    icon: "💳",
    description: "Stripe.js checkout and payment elements.",
    additions: [
      { directive: "script-src", sources: ["https://js.stripe.com"] },
      { directive: "frame-src", sources: ["https://js.stripe.com", "https://hooks.stripe.com"] },
      { directive: "connect-src", sources: ["https://api.stripe.com"] },
    ],
  },
  {
    id: "supabase",
    label: "Supabase",
    icon: "🟢",
    description: "Supabase REST, auth, and realtime sockets.",
    additions: [
      { directive: "connect-src", sources: ["https://*.supabase.co", "wss://*.supabase.co"] },
    ],
    note: "Replace the *.supabase.co wildcard with your exact project domain for a tighter policy.",
  },
  {
    id: "cloudinary",
    label: "Cloudinary",
    icon: "🖼️",
    description: "Cloudinary image and video delivery.",
    additions: [
      { directive: "img-src", sources: ["https://res.cloudinary.com"] },
      { directive: "media-src", sources: ["https://res.cloudinary.com"] },
    ],
  },
  {
    id: "external-apis",
    label: "External APIs",
    icon: "🔌",
    description: "Allow fetch / XHR to any HTTPS API.",
    additions: [
      { directive: "connect-src", sources: ["https:"] },
    ],
    note: "https: lets your app call any HTTPS endpoint. Prefer listing exact API domains in Step 3 when you can.",
  },
  {
    id: "image-cdn",
    label: "Image / CDN domains",
    icon: "🌐",
    description: "Load images from any HTTPS CDN.",
    additions: [
      { directive: "img-src", sources: ["https:", "data:"] },
    ],
    note: "https: in img-src allows images from any HTTPS host. Add specific CDN domains in Step 3 for a stricter policy.",
  },
] as const;
