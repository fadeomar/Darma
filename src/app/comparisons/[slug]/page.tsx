import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialPageView, getEditorialPage, getEditorialPagesByKind } from "@/features/editorial";
import { absoluteUrl } from "@/features/tools/seo";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return getEditorialPagesByKind("comparison").map((page) => ({ slug: page.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const page = getEditorialPage(slug); if (!page || page.kind !== "comparison") return {};
  return { title: `${page.shortTitle} | Darma`, description: page.summary, keywords: [page.primaryKeyword, ...page.secondaryKeywords], authors: [{ name: page.author.name, url: absoluteUrl(page.author.href) }], alternates: { canonical: `/comparisons/${page.slug}` }, openGraph: { title: page.title, description: page.summary, url: absoluteUrl(`/comparisons/${page.slug}`), type: "article", publishedTime: page.publishedAt, modifiedTime: page.updatedAt, authors: [page.author.name], tags: page.secondaryKeywords }, twitter: { card: "summary_large_image", title: page.title, description: page.summary } };
}
export default async function ComparisonPage({ params }: Props) { const { slug } = await params; const page = getEditorialPage(slug); if (!page || page.kind !== "comparison") notFound(); return <EditorialPageView page={page} />; }
