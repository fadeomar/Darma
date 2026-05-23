import { SearchParams } from "@/types";
import { searchElementsDTO } from "@/server/services/search.service";
import { HomeClientPage } from "@/features/elements/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeParam(param: string | string[] | undefined): string[] {
  if (!param) return [];
  return Array.isArray(param) ? param : [param];
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const normalizeSingleParam = (
    param: string | string[] | undefined,
  ): string | undefined => (Array.isArray(param) ? param[0] : param);

  const normalizedParams: SearchParams = {
    q: normalizeSingleParam(resolvedSearchParams.q),
    mainCat: resolvedSearchParams.mainCat,
    secCat: resolvedSearchParams.secCat,
    page: normalizeSingleParam(resolvedSearchParams.page),
    exactMatch: normalizeSingleParam(resolvedSearchParams.exactMatch),
  };

  const { items, total } = await searchElementsDTO({
    q: normalizedParams.q,
    mainCategory: normalizeParam(normalizedParams.mainCat),
    secondaryCategory: normalizeParam(normalizedParams.secCat),
    exactMatch: normalizedParams.exactMatch === "true",
    page: Number(normalizedParams.page || 1),
    pageSize: 12,
    sort: "newest",
  });

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
        initialError={undefined}
        initialParams={normalizedParams}
        basePath="/explore"
      />
    </main>
  );
}
