import type { CspDirectiveName } from "./types";

export type CspServiceAddition = {
  directive: CspDirectiveName;
  sources: string[];
};

export type CspServiceCategory = "core" | "analytics" | "media" | "commerce" | "backend" | "security";

export type CspServiceDefinition = {
  id: string;
  label: string;
  icon: string;
  category: CspServiceCategory;
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
    category: "core",
    description: "Google font stylesheets and font files.",
    additions: [
      { directive: "style-src", sources: ["https://fonts.googleapis.com"] },
      { directive: "font-src", sources: ["https://fonts.gstatic.com"] },
    ],
  },
  {
    id: "image-cdn",
    label: "Image / CDN domains",
    icon: "🌐",
    category: "core",
    description: "Load images from HTTPS CDNs.",
    additions: [{ directive: "img-src", sources: ["https:", "data:"] }],
    note: "https: in img-src allows images from any HTTPS host. Add specific CDN domains in custom domains for a tighter policy.",
  },
  {
    id: "external-apis",
    label: "External APIs",
    icon: "🔌",
    category: "core",
    description: "Allow fetch / XHR to HTTPS APIs.",
    additions: [{ directive: "connect-src", sources: ["https:"] }],
    note: "https: lets your app call any HTTPS endpoint. Prefer exact API domains when you can.",
  },
  {
    id: "google-analytics",
    label: "Google Analytics",
    icon: "📊",
    category: "analytics",
    description: "GA4 and Google Tag Manager tracking.",
    additions: [
      { directive: "script-src", sources: ["https://www.googletagmanager.com", "https://www.google-analytics.com"] },
      { directive: "connect-src", sources: ["https://www.google-analytics.com", "https://www.googletagmanager.com"] },
      { directive: "img-src", sources: ["https://www.google-analytics.com"] },
    ],
  },
  {
    id: "sentry",
    label: "Sentry",
    icon: "🪲",
    category: "analytics",
    description: "Frontend error reporting and replay endpoints.",
    additions: [
      { directive: "connect-src", sources: ["https://*.ingest.sentry.io", "https://*.sentry.io"] },
    ],
    note: "Replace the wildcard with your exact Sentry ingest host when possible.",
  },
  {
    id: "vercel",
    label: "Vercel / Next.js",
    icon: "▲",
    category: "analytics",
    description: "Vercel Analytics, Speed Insights, and Live.",
    additions: [
      { directive: "script-src", sources: ["https://va.vercel-scripts.com"] },
      { directive: "connect-src", sources: ["https://vitals.vercel-insights.com", "https://vercel.live"] },
    ],
  },
  {
    id: "youtube",
    label: "YouTube embeds",
    icon: "▶️",
    category: "media",
    description: "Embedded YouTube players and thumbnails.",
    additions: [
      { directive: "frame-src", sources: ["https://www.youtube.com", "https://www.youtube-nocookie.com"] },
      { directive: "img-src", sources: ["https://i.ytimg.com"] },
    ],
  },
  {
    id: "vimeo",
    label: "Vimeo embeds",
    icon: "🎬",
    category: "media",
    description: "Embedded Vimeo players and thumbnails.",
    additions: [
      { directive: "frame-src", sources: ["https://player.vimeo.com"] },
      { directive: "script-src", sources: ["https://player.vimeo.com"] },
      { directive: "img-src", sources: ["https://i.vimeocdn.com"] },
    ],
  },
  {
    id: "cloudinary",
    label: "Cloudinary",
    icon: "🖼️",
    category: "media",
    description: "Image and video delivery from Cloudinary.",
    additions: [
      { directive: "img-src", sources: ["https://res.cloudinary.com"] },
      { directive: "media-src", sources: ["https://res.cloudinary.com"] },
    ],
  },
  {
    id: "stripe",
    label: "Stripe",
    icon: "💳",
    category: "commerce",
    description: "Stripe.js checkout and payment elements.",
    additions: [
      { directive: "script-src", sources: ["https://js.stripe.com"] },
      { directive: "frame-src", sources: ["https://js.stripe.com", "https://hooks.stripe.com"] },
      { directive: "connect-src", sources: ["https://api.stripe.com"] },
    ],
  },
  {
    id: "paypal",
    label: "PayPal",
    icon: "🅿️",
    category: "commerce",
    description: "PayPal buttons, checkout, and SDK scripts.",
    additions: [
      { directive: "script-src", sources: ["https://www.paypal.com", "https://www.paypalobjects.com"] },
      { directive: "frame-src", sources: ["https://www.paypal.com"] },
      { directive: "connect-src", sources: ["https://www.paypal.com"] },
      { directive: "img-src", sources: ["https://www.paypalobjects.com"] },
    ],
  },
  {
    id: "supabase",
    label: "Supabase",
    icon: "🟢",
    category: "backend",
    description: "Supabase REST, auth, and realtime sockets.",
    additions: [{ directive: "connect-src", sources: ["https://*.supabase.co", "wss://*.supabase.co"] }],
    note: "Replace the *.supabase.co wildcard with your exact project domain for a tighter policy.",
  },
  {
    id: "firebase",
    label: "Firebase",
    icon: "🔥",
    category: "backend",
    description: "Firebase Auth, Firestore, Storage, and APIs.",
    additions: [
      { directive: "connect-src", sources: ["https://*.googleapis.com", "https://*.firebaseio.com", "wss://*.firebaseio.com"] },
      { directive: "img-src", sources: ["https://*.googleusercontent.com"] },
    ],
    note: "Firebase often needs project-specific domains. Tighten wildcards after testing.",
  },
  {
    id: "google-maps",
    label: "Google Maps",
    icon: "🗺️",
    category: "backend",
    description: "Google Maps JavaScript API and map tiles.",
    additions: [
      { directive: "script-src", sources: ["https://maps.googleapis.com"] },
      { directive: "connect-src", sources: ["https://maps.googleapis.com", "https://maps.gstatic.com"] },
      { directive: "img-src", sources: ["https://maps.gstatic.com", "https://*.googleapis.com", "https://*.ggpht.com"] },
    ],
  },
  {
    id: "auth0",
    label: "Auth0",
    icon: "🔐",
    category: "security",
    description: "Auth0 Universal Login and authentication calls.",
    additions: [
      { directive: "connect-src", sources: ["https://*.auth0.com"] },
      { directive: "frame-src", sources: ["https://*.auth0.com"] },
    ],
    note: "Use your exact Auth0 tenant domain instead of *.auth0.com for production.",
  },
  {
    id: "recaptcha",
    label: "reCAPTCHA",
    icon: "✅",
    category: "security",
    description: "Google reCAPTCHA scripts and frames.",
    additions: [
      { directive: "script-src", sources: ["https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"] },
      { directive: "frame-src", sources: ["https://www.google.com/recaptcha/"] },
      { directive: "connect-src", sources: ["https://www.google.com/recaptcha/"] },
    ],
  },
] as const;
