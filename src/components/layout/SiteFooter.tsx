"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ExternalLink, Github, Sparkles } from "lucide-react";
import {
  CONTRIBUTION_LINKS,
  footerVariantForPath,
  groupsForVariant,
  LEGAL_LINKS,
  type FooterLink,
  type FooterVariant,
} from "./footerLinks";

function FooterNavLink({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer">
        {link.label}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    );
  }
  return (
    <Link href={link.href}>
      {link.label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

/**
 * Global footer, in two presentations built from the same link data
 * (`footerLinks.ts`).
 *
 * The single footer this replaces was 1145px tall at 1440x900 — 1.27 viewports
 * — with 25 links, five heading blocks, a 620x430 network diagram, a metric
 * strip, a promo panel and five self-duplicated hrefs (F-14). Users scrolled
 * more than a screen of low-value navigation on every page.
 *
 * - **Full** (landing, About, Atlas root): brand statement, three navigation
 *   groups, a contribution CTA, and the legal row. The storytelling routes are
 *   the only place a longer footer earns its height.
 * - **Compact** (every product and detail route): brand mark, three shorter
 *   navigation groups, and the legal row. No network diagram, no metric cards,
 *   no promo panel.
 */
export default function SiteFooter() {
  const pathname = usePathname();
  const variant: FooterVariant = footerVariantForPath(pathname ?? "/");

  if (variant === "hidden") return null;

  const isFull = variant === "full";
  const groups = groupsForVariant(variant);
  // Rendered on the client, so a fixed build year would go stale. The legal
  // line is not a data claim, so the current year is correct here.
  const year = new Date().getFullYear();

  return (
    <footer
      className={`darma-footer darma-footer-${variant}`}
      data-footer-variant={variant}
      aria-labelledby="darma-footer-title"
    >
      {isFull ? (
        <>
          <div className="darma-footer-aurora darma-footer-aurora-one" aria-hidden />
          <div className="darma-footer-aurora darma-footer-aurora-two" aria-hidden />
        </>
      ) : null}

      <div className="darma-footer-inner">
        <section className="darma-footer-lead">
          <div className="darma-footer-brand-copy">
            {isFull ? (
              <span className="darma-footer-kicker">
                <Sparkles className="h-4 w-4" aria-hidden />
                Open technology workspace
              </span>
            ) : null}
            <div className="darma-footer-brand-row">
              <span className="darma-footer-mark" aria-hidden>D</span>
              <div>
                <h2 id="darma-footer-title">Darma</h2>
                <p>Use the tool. Understand the system. Keep moving.</p>
              </div>
            </div>
            {isFull ? (
              <p className="darma-footer-description">
                Practical browser tools, focused games, cataloged references, learning routes, and career
                guidance in one open workspace.
              </p>
            ) : null}
          </div>

          {isFull ? (
            <div className="darma-footer-contribute">
              <h3>Built in the open</h3>
              <p>Darma is open source. Suggest a source, fix a page, or add a tool.</p>
              <div className="darma-footer-actions">
                {CONTRIBUTION_LINKS.map((link) =>
                  link.external ? (
                    <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                      <Github className="h-4 w-4" aria-hidden />
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.href} href={link.href}>
                      {link.label}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ),
                )}
              </div>
            </div>
          ) : null}
        </section>

        <div className="darma-footer-grid">
          {groups.map((group) => (
            <nav key={group.title} aria-label={`${group.title} links`}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <FooterNavLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="darma-footer-bottom">
          <p>© {year} Darma. Open-source work shaped through visible review and contribution.</p>
          <div>
            {LEGAL_LINKS.map((link) =>
              link.href.startsWith("#") ? (
                <a key={link.href} href={link.href}>{link.label}</a>
              ) : (
                <Link key={link.href} href={link.href}>{link.label}</Link>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
