"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import type { ElementDTO } from "@/features/elements/dto/element.dto";
import CardsPagination from "@/components/CardsPagination";
import SurfaceCard from "@/components/ui/SurfaceCard";
import SectionHeading from "@/components/ui/SectionHeading";
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

  const totalPages = Math.ceil(serverTotal / 6);
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-8 shadow-sm backdrop-blur">
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          All categories
        </Link>
        <SectionHeading
          eyebrow="Category"
          title={mainCategory.replace(/-/g, " ")}
          description={description || "Browse published items in this category."}
        />
        <form
          className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            pushFilters(1, selectedTypes, search);
          }}
        >
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder={`Search in ${mainCategory.replace(/-/g, " ")}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-control-bg)] px-11 py-3 text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)]"
            />
          </label>
          <button className="rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-[var(--color-primary-text)] transition hover:bg-[var(--color-primary-hover)]">
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
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-text)]"
                    : "border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]",
                ].join(" ")}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
            Published items
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{serverTotal} result{serverTotal === 1 ? "" : "s"}</p>
        </div>

        {serverElements.length > 0 ? (
          <CardsPagination
            items={serverElements}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => pushFilters(page)}
            itemsByRow={3}
            renderItem={(element) => (
              <Link
                href={element.slug ? `/elements/${element.slug}` : `/element/${element.id}`}
                key={element.id}
              >
                <SurfaceCard className="h-full transition hover:-translate-y-1 hover:shadow-lg">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                    {(element.secondaryCategory || []).slice(0, 2).join(" • ") || "project"}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">
                    {element.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--color-text-secondary)]">
                    {element.shortDescription || element.description || "Open this item to view the full code and preview."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {element.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--color-control-track)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </SurfaceCard>
              </Link>
            )}
          />
        ) : (
          <SurfaceCard className="text-center">
            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
              No items found
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
              Try removing some filters or search for a broader keyword.
            </p>
          </SurfaceCard>
        )}
      </section>

      {currentCategory ? <CategoryStructuredData category={currentCategory} /> : null}
    </div>
  );
}
