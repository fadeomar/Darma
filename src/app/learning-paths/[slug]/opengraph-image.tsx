import { getLearningPath } from "@/features/learning-paths";
import { atlasOgContentType, atlasOgSize, createAtlasOgImage } from "@/features/visuals/og/createAtlasOgImage";
export const alt = "Darma structured learning path";
export const size = atlasOgSize;
export const contentType = atlasOgContentType;
export default async function Image({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const path = getLearningPath(slug); return createAtlasOgImage({ eyebrow: "Structured learning path", title: path?.title ?? "Darma Learning Path", description: path?.summary ?? "Learn through ordered stages, trusted sources, checkpoints, practical projects, and locally saved progress.", labels: path ? [path.difficulty, path.estimatedWeeks, `${path.stages.length} stages`] : ["Practical roadmap"], symbol: "⌁", accent: "teal" }); }
