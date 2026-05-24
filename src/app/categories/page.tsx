import Link from "next/link";
import type { Metadata } from "next";
import categoriesData from "@/data/category.json";
import PageSection from "@/components/ui/PageSection";
import SurfaceCard from "@/components/ui/SurfaceCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui";
import { getToolRegistry } from "@/features/tools/registry";

export const metadata: Metadata = {
  title: "Categories | Darma",
  description:
    "Browse Darma by category to find UI elements, text effects, games, canvas projects, backgrounds, loaders, apps, and SVG ideas.",
};

export default function CategoriesPage() {
  const tools = getToolRegistry().list().filter((tool) => tool.visibility === "public");
  const toolCategories = Array.from(
    tools.reduce((map, tool) => {
      for (const category of tool.secondaryCategory ?? []) {
        const current = map.get(category) ?? { category, count: 0, featured: [] as string[] };
        current.count += 1;
        if (current.featured.length < 3) current.featured.push(tool.title);
        map.set(category, current);
      }
      return map;
    }, new Map<string, { category: string; count: number; featured: string[] }>()),
  )
    .map(([, value]) => value)
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  return (
    <div className="pb-16">
      <PageSection
        eyebrow="Categories"
        title="Browse the library by topic"
        description="Jump straight into the kind of projects you want to explore, from reusable UI pieces to games, backgrounds, and creative visual experiments."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categoriesData.categories.map((category) => (
            <Link key={category.name} href={`/categories/${category.name}`}>
              <SurfaceCard className="h-full transition hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
                  {category.types.length} subcategories
                </p>
                <h2 className="mt-3 text-2xl font-black capitalize tracking-tight text-slate-900 dark:text-slate-100">
                  {category.name.replace(/-/g, " ")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  {category.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {category.types.slice(0, 6).map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </SurfaceCard>
            </Link>
          ))}
        </div>
      </PageSection>



      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Tool categories"
          title="Find browser tools by workflow category"
          description="These categories are generated from the Darma tool registry, so the tools directory, category links, and SEO metadata stay aligned."
        />
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {toolCategories.map((category) => (
            <Link key={category.category} href="/tools">
              <SurfaceCard className="h-full transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="soft">{category.count} tools</Badge>
                  <Badge variant="outline">Registry</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-black capitalize tracking-tight text-slate-900 dark:text-slate-100">
                  {category.category.replace(/-/g, " ")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  Browse {category.featured.join(", ")} and related Darma tools.
                </p>
              </SurfaceCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How to use Darma"
          title="A faster way to find the right code ideas"
          description="Start with a category when you know the kind of thing you need, then narrow down inside that category with search and secondary filters."
        />
      </section>
    </div>
  );
}
