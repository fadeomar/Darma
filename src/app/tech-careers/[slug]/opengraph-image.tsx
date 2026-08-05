import { getTechCareer } from "@/features/tech-careers";
import { atlasOgContentType, atlasOgSize, createAtlasOgImage } from "@/features/visuals/og/createAtlasOgImage";
export const alt = "Darma technology career guide";
export const size = atlasOgSize;
export const contentType = atlasOgContentType;
export default async function Image({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const career = getTechCareer(slug); return createAtlasOgImage({ eyebrow: "Technology career", title: career?.title ?? "Technology Career Guide", description: career?.summary ?? "Understand daily work, responsibilities, skills, collaborators, and growth of responsibility.", labels: career ? [career.category.replace("-", " + "), career.focus, "Junior → Senior"] : ["Career reference"], symbol: "◈", accent: "teal" }); }
