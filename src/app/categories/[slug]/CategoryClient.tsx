
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import CardsPagination from "@/components/CardsPagination";
import SectionHeading from "@/components/ui/SectionHeading";
import { Badge, Card } from "@/components/ui";
import CategoryStructuredData from "./CategoryStructuredData";
import categoriesData from "@/data/category.json";

interface Props {
  serverElements: ElementDTO[];
  serverTotal: number;
  mainCategory: string;
  allSecondaryCategories: string[];
  selectedSecondaryCategories: string[];
  currentPage: number;
  description?: string;
  searchQuery: string;
}

export default function CategoryClient({
  serverElements,
  serverTotal,
  mainCategory,
  allSecondaryCategories,
  selectedSecondaryCategories,
  currentPage,
  description,
  searchQuery,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchQuery);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(selectedSecondaryCategories);
  const totalPages = Math.max(1, Math.ceil(serverTotal / 6));
  const currentCategory = categoriesData.categories.find((c) => c.name === mainCategory);

  const pushFilters = (nextPage = 1, nextSelected = selectedTypes, nextSearch = search) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextSelected.length > 0) params.set("secCat", nextSelected.join(","));
    if (nextPage > 1) params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleCategory = (category: string) => {
    const nextSelected = selectedTypes.includes(category)
      ? selectedTypes.filter((item) => item !== category)
      : [...selectedTypes, category];
    setSelectedTypes(nextSelected);
    pushFilters(1, nextSelected, search);
  };

  return (
    <main className="mx-auto max-w-[var(--container-wide)] px-4 py-8 sm:px-6 lg:px-8">
      <Card padding="lg">
        <Link href="/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All categories
        </Link>
        <div className="mt-5">
          <SectionHeading
            eyebrow="Category"
            title={mainCategory.replace(/-/g, " ")}
            description={description || "Browse published items in this category."}
          />
        </div>
        <form
          className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            pushFilters(1, selectedTypes, search);
          }}
        >
          <label className="relative block">
            <span className="sr-only">Search category</span>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-hidden />
            <input
              type="text"
              placeholder={`Search in ${mainCategory.replace(/-/g, " ")}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-11 text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition placeholder:text-[var(--color-text-tertiary)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-primary)]"
            />
          </label>
          <button type="button" className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-primary-hover)]">
            Apply filters
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {allSecondaryCategories.map((category) => {
            const active = selectedTypes.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`rounded-[var(--radius-full)] border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </Card>

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">Results</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Published items</h2>
          </div>
          <Badge variant="outline">{serverTotal} result{serverTotal === 1 ? "" : "s"}</Badge>
        </div>

        {serverElements.length > 0 ? (
          <CardsPagination
            items={serverElements}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => pushFilters(page)}
            itemsByRow={3}
            renderItem={(element) => (
              <Link href={element.slug ? `/elements/${element.slug}` : `/element/${element.id}`} key={element.id} className="block h-full">
                <Card variant="interactive" padding="md" className="h-full">
                  <Badge variant="outline">{(element.secondaryCategory || []).slice(0, 2).join(" • ") || "project"}</Badge>
                  <h3 className="mt-4 text-xl font-bold text-[var(--color-text-primary)]">{element.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--color-text-secondary)]">
                    {element.shortDescription || element.description || "Open this item to view the full code and preview."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {element.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Card>
              </Link>
            )}
          />
        ) : (
          <Card className="text-center">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No items found</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">Try removing some filters or search for a broader keyword.</p>
          </Card>
        )}
      </section>

      {currentCategory ? <CategoryStructuredData category={currentCategory} /> : null}
    </main>
  );
}
