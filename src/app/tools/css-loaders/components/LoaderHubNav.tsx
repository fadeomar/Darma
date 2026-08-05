import Link from "next/link";
import { CSS_LOADERS_PATH, countLoadersForHub, getLoaderHubPath, getLoaderHubs, type LoaderHubSlug } from "../loader-hubs";

/**
 * Category navigation as real links, not filter buttons. The gallery keeps its
 * client-side chips; this is the crawlable path into each hub URL and the way a
 * reader gets a shareable link to "skeleton screens" rather than a filter state.
 */
export default function LoaderHubNav({
  activeSlug,
  includeAllLink = false,
  slugs,
  heading,
}: {
  activeSlug?: LoaderHubSlug;
  includeAllLink?: boolean;
  slugs?: LoaderHubSlug[];
  heading?: string;
}) {
  const hubs = getLoaderHubs().filter((hub) => (slugs ? slugs.includes(hub.slug) : true));

  return (
    <nav className="css-loaders-hub-nav" aria-label="Loader categories">
      {heading ? <p className="css-loaders-hub-nav-heading">{heading}</p> : null}
      <div className="css-loaders-hub-nav-links">
        {includeAllLink ? (
          <Link href={CSS_LOADERS_PATH} className="css-loaders-hub-link">
            All loaders
          </Link>
        ) : null}
        {hubs.map((hub) => (
          <Link
            key={hub.slug}
            href={getLoaderHubPath(hub.slug)}
            className="css-loaders-hub-link"
            aria-current={hub.slug === activeSlug ? "page" : undefined}
            data-active={hub.slug === activeSlug ? "true" : undefined}
          >
            {hub.label} <strong>{countLoadersForHub(hub.filters)}</strong>
          </Link>
        ))}
      </div>
    </nav>
  );
}
