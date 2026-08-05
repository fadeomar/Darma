import { atlasOgContentType, atlasOgSize, createAtlasOgImage } from "@/features/visuals/og/createAtlasOgImage";
import { countLoadersForHub, getLoaderHub, LOADER_HUB_SLUGS } from "../loader-hubs";

export const alt = "Darma CSS loader category";
export const size = atlasOgSize;
export const contentType = atlasOgContentType;

export function generateStaticParams() {
  return LOADER_HUB_SLUGS.map((category) => ({ category }));
}

export default async function Image({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const hub = getLoaderHub(category);

  return createAtlasOgImage({
    eyebrow: "CSS loaders",
    title: hub?.heading ?? "CSS Loaders",
    description: hub?.metaDescription ?? "Free CSS loading animations you can customize and copy.",
    labels: hub ? [`${countLoadersForHub(hub.filters)} loaders`, "CSS", "React", "Tailwind"] : ["CSS loaders"],
    symbol: "◐",
    accent: "teal",
  });
}
