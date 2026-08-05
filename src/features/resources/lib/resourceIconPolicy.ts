import type { Resource } from "../schema";

type ResourceIcon = Resource["icon"];

export type ResolvedResourceIcon =
  | { kind: "image"; src: string }
  | { kind: "monogram"; monogram: string };

/**
 * Deterministic one-or-two letter monogram for a resource title.
 *
 * Pure and input-only so server and client render identically (no hydration
 * mismatch) and the tile never depends on randomness or ordering.
 */
export function resourceMonogram(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .split(/[\s.-]+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Decide what a resource identity tile is allowed to render.
 *
 * The catalog records an explicit approval state on every icon
 * (`local | remote-candidate | fallback-only | review-needed`). Only `local`
 * means "this asset has been fetched, checked, and self-hosted", so only that
 * state may produce a network-backed image.
 *
 * Everything else renders a monogram instead of hitting a third-party host.
 * That keeps Darma's browser-local promise honest, avoids disclosing the
 * visitor's IP and referrer to unreviewed domains, and removes the blank-tile
 * window that existed while a slow remote request was still pending.
 *
 * Run `npm run resources:sync-icons` to self-host icons and promote records to
 * `local`; this function then renders them automatically.
 */
export function resolveResourceIcon(icon: ResourceIcon, name: string): ResolvedResourceIcon {
  if (icon.status === "local" && icon.localPath) {
    return { kind: "image", src: icon.localPath };
  }

  return { kind: "monogram", monogram: resourceMonogram(name) };
}

/** True when the icon may be requested over the network. */
export const isApprovedResourceIcon = (icon: ResourceIcon) => icon.status === "local" && Boolean(icon.localPath);
