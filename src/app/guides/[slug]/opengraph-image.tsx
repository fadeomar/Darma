import { getEditorialPage } from "@/features/editorial";
import { atlasOgContentType, atlasOgSize, createAtlasOgImage } from "@/features/visuals/og/createAtlasOgImage";
export const alt = "Darma practical technology guide";
export const size = atlasOgSize;
export const contentType = atlasOgContentType;
export default async function Image({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = getEditorialPage(slug); return createAtlasOgImage({ eyebrow: "Practical guide", title: page?.title ?? "Darma Technology Guide", description: page?.summary ?? "A reviewed practical guide connected to primary references, learning paths, and career outcomes.", labels: page ? [`${page.readingMinutes} min read`, page.primaryKeyword, "Reviewed content"] : ["Reviewed content"], symbol: "↗", accent: "orange" }); }
