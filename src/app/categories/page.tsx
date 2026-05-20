import Link from "next/link";
import type { Metadata } from "next";
import categoriesData from "@/data/category.json";
import PageSection from "@/components/ui/PageSection";
import SurfaceCard from "@/components/ui/SurfaceCard";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Categories | Darma",
  description:
    "Browse Darma by category to find UI elements, text effects, games, canvas projects, backgrounds, loaders, apps, and SVG ideas.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "Categories | Darma",
    description:
      "Browse Darma by topic, including UI elements, effects, games, backgrounds, loaders, apps, and SVG ideas.",
    type: "website",
    url: "/categories",
  },
};

export default function CategoriesPage() {
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
          eyebrow="How to use Darma"
          title="A faster way to find the right code ideas"
          description="Start with a category when you know the kind of thing you need, then narrow down inside that category with search and secondary filters."
        />
      </section>
    </div>
  );
}
