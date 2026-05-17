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

export function buildElementUnavailableMetadata(): Metadata {
  return {
    title: "Element temporarily unavailable | Darma",
    description:
      "This element cannot be loaded right now because the content database is unavailable.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
  };

  if (maybeError.code === "P1001") return true;
  if (maybeError.name === "PrismaClientInitializationError") return true;

  const message = typeof maybeError.message === "string" ? maybeError.message : "";
  return (
    message.includes("Can't reach database server") ||
    message.includes("Timed out fetching a new connection") ||
    message.includes("Connection terminated") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND")
  );
}
