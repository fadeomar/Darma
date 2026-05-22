// src/app/_helpers/elementPage.ts
import type { Metadata } from "next";

type ElementLike = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  shortDescription?: string | null;
  description?: string | null;
};

export function getElementSeoDescription(el: ElementLike) {
  return (
    el.shortDescription || el.description || "HTML/CSS/JS element from Darma."
  );
}

/**
 * Canonical rule:
 * - Prefer slug route as canonical if slug exists: /elements/[slug]
 * - Otherwise fall back to id route: /element/[id]
 */
export function getElementCanonicalPath(el: ElementLike) {
  if (el.slug) return `/elements/${el.slug}`;
  if (el.id) return `/element/${el.id}`;
  return "/elements";
}

export function buildElementMetadata(el: ElementLike): Metadata {
  const title = el.title ? `${el.title} | Darma` : "Element | Darma";
  const description = getElementSeoDescription(el);
  const canonical = getElementCanonicalPath(el);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
    },
  };
}

export function buildNotFoundMetadata(): Metadata {
  return {
    title: "Element not found | Darma",
    description: "The element you are looking for does not exist.",
    robots: {
      index: false,
      follow: false,
    },
  };
}
