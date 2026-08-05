import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ToolPage } from "@/features/tools/layouts";
import { getToolRegistry } from "@/features/tools/registry";
import CssLoadersClient from "../CssLoadersClient";
import LoaderBreadcrumbs from "../components/LoaderBreadcrumbs";
import LoaderHubNav from "../components/LoaderHubNav";
import LoaderStaticGrid from "../components/LoaderStaticGrid";
import { loadLoaderPreviewCategory } from "../loader-data";
import {
  CSS_LOADERS_PATH,
  countLoadersForHub,
  getLoaderHub,
  getLoaderHubPath,
  LOADER_HUB_SLUGS,
} from "../loader-hubs";
import { buildLoaderHubJsonLd, buildLoaderHubMetadata, serializeJsonLd } from "../seo";
import type { LoaderPreviewItem } from "../types";
import "../styles.css";

const tool = getToolRegistry().getById("css-loaders");

/** Server-rendered sample per hub. The ItemList never claims more than this. */
const HUB_LOADER_COUNT = 12;
const HUB_ANCHOR_PREFIX = "css-loader-hub-";

type PageProps = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return LOADER_HUB_SLUGS.map((category) => ({ category }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const hub = getLoaderHub(category);
  if (!hub) return {};
  return buildLoaderHubMetadata(hub);
}

export default async function LoaderHubPage({ params }: PageProps) {
  const { category } = await params;
  const hub = getLoaderHub(category);
  if (!hub || !tool) notFound();

  const chunk = await loadLoaderPreviewCategory(hub.previewChunk);
  const hubLoaders: LoaderPreviewItem[] = chunk
    .filter((loader) => (hub.filters.format === "all" ? true : loader.formats.includes(hub.filters.format)))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, HUB_LOADER_COUNT);

  const path = getLoaderHubPath(hub.slug);
  const totalInHub = countLoadersForHub(hub.filters);
  const jsonLd = buildLoaderHubJsonLd({ hub, loaders: hubLoaders, anchorPrefix: HUB_ANCHOR_PREFIX });

  return (
    <ToolPage
      tool={tool}
      title={hub.heading}
      description={hub.metaDescription}
      maxWidth="full"
      eyebrow="Loader category"
      headerSize="compact"
      intro={
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
          <LoaderBreadcrumbs
            trail={[
              { name: "Home", path: "/" },
              { name: "Tools", path: "/tools" },
              { name: "CSS Loaders", path: CSS_LOADERS_PATH },
              { name: hub.label, path },
            ]}
          />
        </>
      }
    >
      <section className="css-loaders-intro" aria-labelledby="css-loaders-hub-intro-title">
        <h2 id="css-loaders-hub-intro-title">
          {totalInHub} {hub.listNoun} to preview and copy
        </h2>
        <p>{hub.intro}</p>
        <p className="css-loaders-intro-links">
          <Link href={CSS_LOADERS_PATH}>Open the full loader gallery</Link> or keep browsing a related category.
        </p>
        <LoaderHubNav activeSlug={hub.slug} slugs={hub.related} heading="Related categories" />
      </section>

      <section className="css-loaders-featured" aria-labelledby="css-loaders-hub-featured-title">
        <div className="css-loaders-featured-head">
          <h2 id="css-loaders-hub-featured-title">Selected {hub.listNoun}</h2>
        </div>
        <LoaderStaticGrid loaders={hubLoaders} anchorPrefix={HUB_ANCHOR_PREFIX} />
      </section>

      <CssLoadersClient initialFilters={hub.filters} />

      <section className="css-loaders-intro" aria-label="All loader categories">
        <LoaderHubNav activeSlug={hub.slug} includeAllLink heading="All loader categories" />
      </section>
    </ToolPage>
  );
}
