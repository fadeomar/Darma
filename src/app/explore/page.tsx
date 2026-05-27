
import { SearchParams } from "@/types";
import { searchElementsDTO } from "@/server/services/search.service";
import { HomeClientPage } from "@/features/elements/ui";
import { Badge, Card } from "@/components/ui";

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
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[var(--container-wide)]">
        <Card padding="lg" className="mb-6">
          <Badge variant="soft">Explore</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-5xl">
            Browse Darma projects
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
            Search the collection, filter by categories, and open full previews for HTML, CSS, and JavaScript ideas you want to study or reuse.
          </p>
        </Card>
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
