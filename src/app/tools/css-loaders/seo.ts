import type { Metadata } from "next";
import { absoluteUrl } from "@/features/tools/seo";
import {
  CSS_LOADERS_PATH,
  countLoadersForHub,
  getLoaderHubPath,
  type LoaderHub,
} from "./loader-hubs";
import type { LoaderIndexItem } from "./types";

/*
 * The loader gallery is a flagship entry point, so it does not inherit the
 * generic "<tool title> | Darma Tools" metadata every utility page uses. The
 * shared helper stays in place for normal tools; this file is the override.
 */
export const CSS_LOADERS_TITLE = "CSS Loaders: 1,300+ Spinners & Skeletons | Darma";
export const CSS_LOADERS_DESCRIPTION =
  "Browse 1,300+ free CSS loaders, spinners, skeleton screens, button loaders and progress animations. Customize colors, size and speed, then copy CSS, React or Tailwind.";

/** JSON-LD is injected as raw HTML, so close any tag sequence the data contains. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildCssLoadersMetadata(): Metadata {
  return {
    title: CSS_LOADERS_TITLE,
    description: CSS_LOADERS_DESCRIPTION,
    alternates: { canonical: CSS_LOADERS_PATH },
    openGraph: {
      title: CSS_LOADERS_TITLE,
      description: CSS_LOADERS_DESCRIPTION,
      url: absoluteUrl(CSS_LOADERS_PATH),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: CSS_LOADERS_TITLE,
      description: CSS_LOADERS_DESCRIPTION,
    },
  };
}

export function buildLoaderHubMetadata(hub: LoaderHub): Metadata {
  const path = getLoaderHubPath(hub.slug);

  return {
    title: hub.metaTitle,
    description: hub.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: hub.metaTitle,
      description: hub.metaDescription,
      url: absoluteUrl(path),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: hub.metaTitle,
      description: hub.metaDescription,
    },
  };
}

type BreadcrumbEntry = { name: string; path: string };

export function buildBreadcrumbList(entries: BreadcrumbEntry[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  };
}

/**
 * Only the loaders actually rendered into the HTML are listed. The gallery
 * holds 1,300+, but claiming all of them in an ItemList would not match the
 * page a crawler receives.
 */
function buildLoaderItemList(id: string, pagePath: string, loaders: LoaderIndexItem[], anchorPrefix: string) {
  return {
    "@type": "ItemList",
    "@id": id,
    numberOfItems: loaders.length,
    itemListElement: loaders.map((loader, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: loader.name,
      url: `${absoluteUrl(pagePath)}#${anchorPrefix}${loader.id}`,
    })),
  };
}

export function buildCssLoadersJsonLd({
  webApplication,
  featuredLoaders,
  totalLoaders,
  anchorPrefix,
}: {
  webApplication: Record<string, unknown>;
  featuredLoaders: LoaderIndexItem[];
  totalLoaders: number;
  anchorPrefix: string;
}) {
  const url = absoluteUrl(CSS_LOADERS_PATH);
  const listId = `${url}#featured-loaders`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      { ...webApplication, "@id": `${url}#app` },
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        name: "CSS Loaders",
        headline: "CSS loaders, spinners, and skeleton screens",
        description: CSS_LOADERS_DESCRIPTION,
        url,
        isPartOf: { "@id": `${url}#app` },
        about: `${totalLoaders} copy-ready CSS loading animations`,
        mainEntity: { "@id": listId },
      },
      buildBreadcrumbList([
        { name: "Home", path: "/" },
        { name: "Tools", path: "/tools" },
        { name: "CSS Loaders", path: CSS_LOADERS_PATH },
      ]),
      buildLoaderItemList(listId, CSS_LOADERS_PATH, featuredLoaders, anchorPrefix),
    ],
  };
}

export function buildLoaderHubJsonLd({
  hub,
  loaders,
  anchorPrefix,
}: {
  hub: LoaderHub;
  loaders: LoaderIndexItem[];
  anchorPrefix: string;
}) {
  const path = getLoaderHubPath(hub.slug);
  const url = absoluteUrl(path);
  const listId = `${url}#loaders`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        name: hub.heading,
        headline: hub.heading,
        description: hub.metaDescription,
        url,
        isPartOf: { "@id": `${absoluteUrl(CSS_LOADERS_PATH)}#app` },
        about: `${countLoadersForHub(hub.filters)} ${hub.listNoun}`,
        mainEntity: { "@id": listId },
      },
      buildBreadcrumbList([
        { name: "Home", path: "/" },
        { name: "Tools", path: "/tools" },
        { name: "CSS Loaders", path: CSS_LOADERS_PATH },
        { name: hub.label, path },
      ]),
      buildLoaderItemList(listId, path, loaders, anchorPrefix),
    ],
  };
}
