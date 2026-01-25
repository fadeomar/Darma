import ThemeToggle from "@/components/ThemeToggle";
import FancyCTAButton from "@/components/CTAButton";
import { SearchParams } from "@/types";
import { searchElementsDTO } from "@/server/services/search.service";
import { HomeClientPage } from "@/features/projects/ui";

// Normalize a parameter to an array of strings
function normalizeParam(param: string | string[] | undefined): string[] {
  if (!param) return [];
  return Array.isArray(param) ? param : [param];
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  // Normalize searchParams to handle single strings or arrays
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

  // const { elements, total, error } = await fetchElements(normalizedParams);
  const { items, total } = await searchElementsDTO({
    q: normalizedParams.q,
    mainCategory: normalizeParam(normalizedParams.mainCat),
    secondaryCategory: normalizeParam(normalizedParams.secCat),
    exactMatch: normalizedParams.exactMatch === "true",
    page: Number(normalizedParams.page || 1),
    pageSize: 6,
    sort: "newest", // instead of createdAt
  });
  return (
    <main className="min-h-screen p-8 bg-baseColor text-textColor">
      <header className="flex justify-between items-center mb-12">
        <ThemeToggle />
        <FancyCTAButton href="/tools" label="Explore Tools" />
      </header>
      <HomeClientPage
        // initialElements={elements}
        // initialElements={
        //   error ? getRandomItem(elements1.elements, 10) : elements
        // }
        // initialTotal={total}
        // initialError={error}
        // initialParams={normalizedParams}
        initialElements={items}
        initialTotal={total}
        initialError={undefined}
        initialParams={normalizedParams}
      />
    </main>
  );
}
