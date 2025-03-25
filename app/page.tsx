// app/page.tsx
import HomeClientPage from "@/sections/HomeClientPage";
import { CodeElement } from "@/types";

interface SearchParams {
  q?: string;
  mainCat?: string | string[];
  secCat?: string | string[];
  page?: string;
  exactMatch?: string;
}

const normalizeParam = (param: string | string[] | undefined): string[] =>
  param ? (Array.isArray(param) ? param : [param]) : [];

const getInitialData = async (searchParams: SearchParams) => {
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

  let baseUrl = "";
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else if (process.env.VERCEL_URL) {
    baseUrl = process.env.VERCEL_URL;
  } else {
    baseUrl = "http://localhost:3000";
  }
  try {
    const response = await fetch(`${baseUrl}/api/search?${params.toString()}`);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const data = await response.json();
    return {
      elements: data.elements as CodeElement[],
      total: data.total as number,
    };
  } catch (error) {
    console.error("Fetch error:", error);
    return { elements: [], total: 0 };
  }
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const { elements, total } = await getInitialData(resolvedParams);

  return (
    <HomeClientPage
      serverElements={elements}
      serverTotal={total}
      // searchParams={resolvedParams}
    />
  );
}
