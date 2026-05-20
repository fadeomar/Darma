import type { Metadata } from "next";
import { SearchParams } from "@/types";
import { searchElementsDTO } from "@/server/services/search.service";
import { HomeClientPage } from "@/features/elements/ui";
import type { ElementDTO } from "@/features/elements/dto/element.dto";

export const metadata: Metadata = {
  title: "Explore Darma Projects | Darma",
  description:
    "Search and filter published Darma HTML, CSS, JavaScript, UI, animation, background, loader, and canvas projects.",
  alternates: { canonical: "/explore" },
  openGraph: {
    title: "Explore Darma Projects | Darma",
    description: "Browse reusable front-end ideas, previews, and code examples from the Darma library.",
    type: "website",
    url: "/explore",
  },
};

function normalizeParam(param: string | string[] | undefined): string[] {
  if (!param) return [];
  const values = Array.isArray(param) ? param : [param];
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeSingleParam(
  param: string | string[] | undefined,
): string | undefined {
  const value = Array.isArray(param) ? param[0] : param;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizePage(value: string | undefined) {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const normalizedParams: SearchParams = {
    q: normalizeSingleParam(resolvedSearchParams.q),
    mainCat: resolvedSearchParams.mainCat,
    secCat: resolvedSearchParams.secCat,
    page: normalizeSingleParam(resolvedSearchParams.page),
    exactMatch: normalizeSingleParam(resolvedSearchParams.exactMatch),
  };

  let items: ElementDTO[] = [];
  let total = 0;
  let initialError: string | undefined;

  try {
    const result = await searchElementsDTO({
      q: normalizedParams.q,
      mainCategory: normalizeParam(normalizedParams.mainCat),
      secondaryCategory: normalizeParam(normalizedParams.secCat),
      exactMatch: normalizedParams.exactMatch === "true",
      page: normalizePage(normalizedParams.page),
      pageSize: 12,
      sort: "newest",
    });
    items = result.items;
    total = result.total;
  } catch (error) {
    console.error("Explore page search failed:", error);
    initialError = "We could not load projects right now. Please try again after checking the database connection and migrations.";
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600">Explore</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Browse Darma projects</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700 dark:text-slate-300">
          Search the collection, filter by categories, and open full previews for the HTML, CSS, and JavaScript ideas you want to study or reuse.
        </p>
      </div>
      <HomeClientPage
        initialElements={items}
        initialTotal={total}
        initialError={initialError}
        initialParams={normalizedParams}
        basePath="/explore"
      />
    </main>
  );
}
