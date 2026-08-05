/**
 * Single source of truth for both footer presentations.
 *
 * Both variants are built from this data, and the invariant that matters is
 * that **no href appears twice inside one variant**. The previous footer
 * repeated five of its own links (`/tools`, `/search`, `/editorial-policy`,
 * `/contribute` and the GitHub URL each appeared in a nav group *and* in a
 * promo or legal row), which is F-14. `footerLinks.contract.test.ts` enforces
 * the invariant so a new link cannot silently reintroduce it.
 *
 * Ownership rule that keeps it true: the contribution CTA owns `/contribute`
 * and the GitHub URL, the legal row owns `/editorial-policy`, and everything
 * else lives in exactly one nav group.
 */

export type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type FooterGroup = {
  title: string;
  links: FooterLink[];
};

/** Groups shown by the compact footer, in order. Capped at three. */
export const COMPACT_FOOTER_GROUPS: FooterGroup[] = [
  {
    title: "Use Darma",
    links: [
      { href: "/tools", label: "Browser tools" },
      { href: "/games", label: "Browser games" },
      { href: "/search", label: "Search everything" },
    ],
  },
  {
    title: "Tech Atlas",
    links: [
      { href: "/tech-atlas", label: "Atlas home" },
      { href: "/resources", label: "Resource library" },
      { href: "/learning-paths", label: "Learning paths" },
      { href: "/tech-careers", label: "Tech careers" },
    ],
  },
  {
    title: "Decide and learn",
    links: [
      { href: "/guides", label: "Practical guides" },
      { href: "/comparisons", label: "Comparisons" },
      { href: "/tech-glossary", label: "Tech glossary" },
      { href: "/about", label: "About Darma" },
    ],
  },
];

/** Groups shown by the full footer, in order. */
export const FULL_FOOTER_GROUPS: FooterGroup[] = [
  {
    title: "Use Darma",
    links: [
      { href: "/tools", label: "Browser tools" },
      { href: "/games", label: "Browser games" },
      { href: "/explore", label: "Explore snippets" },
      { href: "/workflows", label: "Connected workflows" },
      { href: "/search", label: "Search everything" },
    ],
  },
  {
    title: "Tech Atlas",
    links: [
      { href: "/tech-atlas", label: "Atlas home" },
      { href: "/resources", label: "Resource library" },
      { href: "/learning-paths", label: "Learning paths" },
      { href: "/tech-careers", label: "Tech careers" },
      { href: "/tech-teams", label: "Teams and delivery" },
      { href: "/tech-glossary", label: "Tech glossary" },
    ],
  },
  {
    title: "Decide and learn",
    links: [
      { href: "/guides", label: "Practical guides" },
      { href: "/comparisons", label: "Comparisons" },
      { href: "/career-pathfinder", label: "Career Pathfinder" },
      { href: "/ways-of-working", label: "Ways of working" },
      { href: "/about", label: "About Darma" },
    ],
  },
];

export const GITHUB_URL = "https://github.com/fadeomar/Darma";

/**
 * Contribution CTA. Owns `/contribute` and the GitHub URL, so neither may
 * appear in a nav group or the legal row.
 */
export const CONTRIBUTION_LINKS: FooterLink[] = [
  { href: "/contribute", label: "Contribute to Darma" },
  { href: GITHUB_URL, label: "GitHub repository", external: true },
];

/**
 * Utility/legal row, present in both variants. Owns `/editorial-policy`.
 * `#main-content` is a fragment on the current page, not a route, so it never
 * collides with a nav href.
 */
export const LEGAL_LINKS: FooterLink[] = [
  { href: "/editorial-policy", label: "Editorial policy" },
  { href: "#main-content", label: "Back to top ↑" },
];

/** Routes that get the full footer. Everything else gets the compact one. */
export const FULL_FOOTER_ROUTES = ["/", "/about", "/tech-atlas"] as const;

/** Routes with no footer at all. */
export const FOOTER_HIDDEN_PREFIXES = ["/admin", "/login"] as const;

export type FooterVariant = "full" | "compact" | "hidden";

export function footerVariantForPath(pathname: string): FooterVariant {
  if (FOOTER_HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return "hidden";
  }
  return (FULL_FOOTER_ROUTES as readonly string[]).includes(pathname) ? "full" : "compact";
}

export function groupsForVariant(variant: Exclude<FooterVariant, "hidden">): FooterGroup[] {
  return variant === "full" ? FULL_FOOTER_GROUPS : COMPACT_FOOTER_GROUPS;
}

/** Every href a variant renders, in render order. Used by the duplicate test. */
export function hrefsForVariant(variant: Exclude<FooterVariant, "hidden">): string[] {
  const groupHrefs = groupsForVariant(variant).flatMap((group) => group.links.map((link) => link.href));
  const ctaHrefs = variant === "full" ? CONTRIBUTION_LINKS.map((link) => link.href) : [];
  return [...groupHrefs, ...ctaHrefs, ...LEGAL_LINKS.map((link) => link.href)];
}
