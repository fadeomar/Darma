import loaderIndexJson from "./data/generated/loader-index.json";
import type { LoaderCategory, LoaderFormat, LoaderIndexItem } from "./types";

/**
 * Crawlable category hubs for the loader gallery.
 *
 * The gallery itself is one client-side URL, so search engines only ever saw a
 * single page for 1,300+ loaders. These hubs give the useful intents ("skeleton
 * screens", "button loaders") their own indexable URL, opened on the matching
 * filter — instead of generating a thin page per loader. The slug list is an
 * allowlist: anything else is a 404, not a soft-404 empty gallery.
 */
export const LOADER_HUB_SLUGS = [
  "spinners",
  "dots",
  "skeletons",
  "button-loaders",
  "progress",
  "react",
  "tailwind",
] as const;

export type LoaderHubSlug = (typeof LOADER_HUB_SLUGS)[number];

export type LoaderHubFilters = {
  category: LoaderCategory;
  format: "all" | LoaderFormat;
};

export type LoaderHub = {
  slug: LoaderHubSlug;
  /** Chip and breadcrumb label. */
  label: string;
  /** Plural noun used in visible headings and structured data. */
  listNoun: string;
  heading: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  /** Gallery state the hub opens with. */
  filters: LoaderHubFilters;
  /** Generated preview chunk the server-rendered strip is built from. */
  previewChunk: Exclude<LoaderCategory, "all">;
  related: LoaderHubSlug[];
};

const loaderIndex = loaderIndexJson as LoaderIndexItem[];

export const CSS_LOADERS_PATH = "/tools/css-loaders";

export function countLoadersForHub(filters: LoaderHubFilters) {
  return loaderIndex.filter((loader) => {
    const categoryMatch =
      filters.category === "all" ||
      (filters.category === "popular" ? Boolean(loader.flags.popular) : loader.category === filters.category);
    const formatMatch = filters.format === "all" || loader.formats.includes(filters.format);
    return categoryMatch && formatMatch;
  }).length;
}

const HUBS: Record<LoaderHubSlug, LoaderHub> = {
  spinners: {
    slug: "spinners",
    label: "Spinners",
    listNoun: "CSS spinners",
    heading: "CSS spinners",
    metaTitle: "CSS Spinners: Free Rotating Loading Animations | Darma",
    metaDescription:
      "Free CSS spinner animations for buttons, overlays and page loads. Preview each rotating loader, adjust color, size and speed, then copy CSS, React or Tailwind.",
    intro:
      "Spinners suit short waits where the remaining time is unknown — saving a record, authenticating, refreshing a view. Every spinner here is pure CSS, so it works without JavaScript and keeps its animation when you change color, size or speed.",
    filters: { category: "spinners", format: "all" },
    previewChunk: "spinners",
    related: ["dots", "button-loaders", "progress"],
  },
  dots: {
    slug: "dots",
    label: "Dots",
    listNoun: "dot loaders",
    heading: "CSS dot loaders",
    metaTitle: "CSS Dot Loaders: Bouncing & Pulsing Dots | Darma",
    metaDescription:
      "Free CSS dot loaders — bouncing, pulsing and typing-indicator animations for chat, inline status and small buttons. Customize and copy CSS, React or Tailwind.",
    intro:
      "Dot loaders read as calm, low-attention progress. They fit chat typing indicators, inline status text and compact buttons where a full spinner would dominate the layout.",
    filters: { category: "dots", format: "all" },
    previewChunk: "dots",
    related: ["spinners", "button-loaders", "progress"],
  },
  skeletons: {
    slug: "skeletons",
    label: "Skeletons",
    listNoun: "skeleton screens",
    heading: "CSS skeleton screens",
    metaTitle: "CSS Skeleton Screens: Shimmer Placeholder Loaders | Darma",
    metaDescription:
      "Free CSS skeleton loading screens for cards, lists and dashboards. Shimmer placeholders that hold the final layout — customize and copy CSS, React or Tailwind.",
    intro:
      "Skeleton screens keep the shape of the interface while its content arrives, so the page does not jump when data lands. Use them when the layout is already known — cards, tables, dashboards, profile headers — and keep spinners for unknown waits.",
    filters: { category: "skeleton", format: "all" },
    previewChunk: "skeleton",
    related: ["progress", "spinners", "react"],
  },
  "button-loaders": {
    slug: "button-loaders",
    label: "Button loaders",
    listNoun: "button loaders",
    heading: "CSS button loaders",
    metaTitle: "CSS Button Loaders: Inline Submit & Save Spinners | Darma",
    metaDescription:
      "Free CSS button loading states for submit, save, upload and checkout actions. Small inline loaders sized for buttons — copy as CSS, React or Tailwind.",
    intro:
      "Button loaders replace the label of an action while the request is in flight. Keep the button width stable, keep the accessible name meaningful, and pair the animation with text such as “Saving…” so the state is announced, not only drawn.",
    filters: { category: "button", format: "all" },
    previewChunk: "button",
    related: ["spinners", "dots", "react"],
  },
  progress: {
    slug: "progress",
    label: "Progress",
    listNoun: "progress loaders",
    heading: "CSS progress loaders",
    metaTitle: "CSS Progress Bars & Loading Indicators | Darma",
    metaDescription:
      "Free CSS progress bars and indeterminate loading indicators for uploads, imports and multi-step flows. Customize color, size and speed, then copy the code.",
    intro:
      "Progress bars work when the wait is long enough to measure, or when a task runs in steps. Determinate bars should reflect real progress; the indeterminate patterns here are for work whose length you cannot predict.",
    filters: { category: "progress", format: "all" },
    previewChunk: "progress",
    related: ["skeletons", "spinners", "dots"],
  },
  react: {
    slug: "react",
    label: "React",
    listNoun: "React-ready loaders",
    heading: "React loading spinners",
    metaTitle: "React Loading Spinners: Copy-Ready Components | Darma",
    metaDescription:
      "Copy popular CSS loaders as ready React components with typed inline styles. Drop them into buttons, Suspense fallbacks and overlays without extra packages.",
    intro:
      "Every loader in the gallery exports a React component: open one, switch to the React tab, and copy a self-contained component with its styles applied through CSS variables. This hub opens the popular set so you can pick a well-tested loader, then paste it into a button, an overlay, or a Suspense fallback — no runtime dependency is added to your project.",
    filters: { category: "popular", format: "react" },
    previewChunk: "popular",
    related: ["tailwind", "button-loaders", "skeletons"],
  },
  tailwind: {
    slug: "tailwind",
    label: "Tailwind",
    listNoun: "Tailwind loaders",
    heading: "Tailwind CSS loaders",
    metaTitle: "Tailwind CSS Loaders: Utility-Class Spinners | Darma",
    metaDescription:
      "Free Tailwind CSS loaders and spinners built from utility classes. Preview each one, adjust color, size and speed, then copy the Tailwind, CSS or React output.",
    intro:
      "These loaders ship a Tailwind output built from utility classes. Copy the markup straight into a component, or take the CSS tab instead when a loader needs a keyframe that lives better in your stylesheet than in an arbitrary-value class.",
    filters: { category: "tailwind", format: "all" },
    previewChunk: "tailwind",
    related: ["react", "spinners", "dots"],
  },
};

export function isLoaderHubSlug(slug: string): slug is LoaderHubSlug {
  return (LOADER_HUB_SLUGS as readonly string[]).includes(slug);
}

export function getLoaderHub(slug: string): LoaderHub | null {
  return isLoaderHubSlug(slug) ? HUBS[slug] : null;
}

export function getLoaderHubs(): LoaderHub[] {
  return LOADER_HUB_SLUGS.map((slug) => HUBS[slug]);
}

export function getLoaderHubPath(slug: LoaderHubSlug) {
  return `${CSS_LOADERS_PATH}/${slug}`;
}

export function getTotalLoaderCount() {
  return loaderIndex.length;
}
