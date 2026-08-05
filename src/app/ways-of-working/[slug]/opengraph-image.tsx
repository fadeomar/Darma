import { getWayOfWorking } from "@/features/ways-of-working";
import { atlasOgContentType, atlasOgSize, createAtlasOgImage } from "@/features/visuals/og/createAtlasOgImage";
export const alt = "Darma ways of working guide";
export const size = atlasOgSize;
export const contentType = atlasOgContentType;
export default async function Image({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const way = getWayOfWorking(slug); return createAtlasOgImage({ eyebrow: "Way of working", title: way?.title ?? "Ways of Working", description: way?.summary ?? "Compare purpose, flow, roles, cadence, strengths, risks, and healthy signals.", labels: way ? [way.kind, `${way.flow.length} flow stages`, "Official references"] : ["Workflow reference"], symbol: "∞", accent: "orange" }); }
