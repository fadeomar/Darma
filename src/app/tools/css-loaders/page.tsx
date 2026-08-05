import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolPage } from "@/features/tools/layouts";
import { getToolRegistry } from "@/features/tools/registry";
import { buildToolJsonLd } from "@/features/tools/seo";
import CssLoadersClient from "./CssLoadersClient";
import Article from "./Article";
import LoaderBreadcrumbs from "./components/LoaderBreadcrumbs";
import LoaderHubNav from "./components/LoaderHubNav";
import LoaderStaticGrid from "./components/LoaderStaticGrid";
import { loadLoaderPreviewCategory } from "./loader-data";
import { CSS_LOADERS_PATH, getTotalLoaderCount } from "./loader-hubs";
import { buildCssLoadersJsonLd, buildCssLoadersMetadata, serializeJsonLd } from "./seo";
import "./styles.css";

const tool = getToolRegistry().getById("css-loaders");

/** Featured strip size — small enough to stay honest against the ItemList. */
const FEATURED_LOADER_COUNT = 8;
const FEATURED_ANCHOR_PREFIX = "css-loader-featured-";

export const metadata = buildCssLoadersMetadata();

export default async function CssLoadersPage() {
  if (!tool) notFound();

  const popular = await loadLoaderPreviewCategory("popular");
  const featuredLoaders = [...popular].sort((a, b) => a.name.localeCompare(b.name)).slice(0, FEATURED_LOADER_COUNT);
  const jsonLd = buildCssLoadersJsonLd({
    webApplication: buildToolJsonLd(tool),
    featuredLoaders,
    totalLoaders: getTotalLoaderCount(),
    anchorPrefix: FEATURED_ANCHOR_PREFIX,
  });

  return (
    <ToolPage
      tool={tool}
      maxWidth="full"
      eyebrow="CSS gallery"
      headerSize="compact"
      article={<Article />}
      intro={
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
          <LoaderBreadcrumbs
            trail={[
              { name: "Home", path: "/" },
              { name: "Tools", path: "/tools" },
              { name: "CSS Loaders", path: CSS_LOADERS_PATH },
            ]}
          />
        </>
      }
    >
      <section className="css-loaders-intro" aria-labelledby="css-loaders-intro-title">
        <h2 id="css-loaders-intro-title">Free CSS loaders, spinners, and skeleton screens</h2>
        <p>
          The gallery holds {getTotalLoaderCount()} loading animations written in plain CSS. Preview one, adjust its color,
          size, and speed, then copy the CSS, HTML, React, or Tailwind output — nothing is added to your bundle beyond the
          snippet you paste. Pick a spinner for short, unpredictable waits, a skeleton screen when the layout is already
          known, and a progress bar when the work can actually be measured.
        </p>
        <LoaderHubNav heading="Browse by loading state" />
      </section>

      <section className="css-loaders-featured" aria-labelledby="css-loaders-featured-title">
        <div className="css-loaders-featured-head">
          <h2 id="css-loaders-featured-title">Featured loaders</h2>
          <Link href="/tools/css-loaders/skeletons" className="css-loaders-hub-link">
            Skeleton screens
          </Link>
        </div>
        <LoaderStaticGrid loaders={featuredLoaders} anchorPrefix={FEATURED_ANCHOR_PREFIX} />
      </section>

      <CssLoadersClient />
    </ToolPage>
  );
}
