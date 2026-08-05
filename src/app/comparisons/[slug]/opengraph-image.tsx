import { getEditorialPage } from "@/features/editorial";
import { atlasOgContentType, atlasOgSize, createAtlasOgImage } from "@/features/visuals/og/createAtlasOgImage";
export const alt = "Darma technology comparison";
export const size = atlasOgSize;
export const contentType = atlasOgContentType;
export default async function Image({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const page = getEditorialPage(slug); return createAtlasOgImage({ eyebrow: "Decision comparison", title: page?.title ?? "Darma Technology Comparison", description: page?.summary ?? "A practical comparison based on context, constraints, trade-offs, and primary references.", labels: page ? [`${page.readingMinutes} min read`, "Decision framework", "Primary sources"] : ["Decision framework"], symbol: "⇄", accent: "mixed" }); }
