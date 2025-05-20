import ThemeToggle from "@/components/ThemeToggle";
import FancyCTAButton from "@/components/CTAButton";
import HomeClientPage from "@/sections/HomeClientPage";
import { CodeElement, SearchParams } from "@/types";

const getBaseUrl = () => {
  const isDev = process.env.NODE_ENV === "development";
  const baseUrl = isDev
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;
  return baseUrl;
};

// Fetch data from the API based on search parameters
async function fetchElements(searchParams: SearchParams) {
  const params = new URLSearchParams();
  const { q, mainCat, secCat, page = "1", exactMatch = "false" } = searchParams;

  if (q?.trim()) params.set("q", q.trim());
  normalizeParam(mainCat).forEach((c) => params.append("mainCat", c));
  normalizeParam(secCat).forEach((c) => params.append("secCat", c));
  params.set("page", page);
  params.set("pageSize", "6");
  params.set("exactMatch", exactMatch);
  params.set("sort", "createdAt");
  params.set("order", "desc");

  const baseUrl = getBaseUrl();
  console.log("Fetching from page.tsx with params:", params.toString());

  try {
    const response = await fetch(`${baseUrl}/api/search?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const data = await response.json();
    return {
      elements: data.elements as CodeElement[],
      total: data.total as number,
    };
  } catch (error) {
    console.error("Fetch error in page.tsx:", error);
    return { elements: [], total: 0, error: (error as Error).message };
  }
}

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
    param: string | string[] | undefined
  ): string | undefined => (Array.isArray(param) ? param[0] : param);

  const normalizedParams: SearchParams = {
    q: normalizeSingleParam(resolvedSearchParams.q),
    mainCat: resolvedSearchParams.mainCat,
    secCat: resolvedSearchParams.secCat,
    page: normalizeSingleParam(resolvedSearchParams.page),
    exactMatch: normalizeSingleParam(resolvedSearchParams.exactMatch),
  };

  const { elements, total, error } = await fetchElements(normalizedParams);

  return (
    <main className="min-h-screen p-8 bg-baseColor text-textColor">
      <header className="flex justify-between items-center mb-12">
        <ThemeToggle />
        <FancyCTAButton href="/tools" label="Explore Tools" />
      </header>
      <HomeClientPage
        initialElements={elements}
        initialTotal={total}
        initialError={error}
        initialParams={normalizedParams}
      />
    </main>
  );
}
