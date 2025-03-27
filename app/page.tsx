// app/page.tsx
import HomeClientPage from "@/sections/HomeClientPage";
import { CodeElement } from "@/types";

export interface SearchParams {
  q?: string;
  mainCat?: string | string[];
  secCat?: string | string[];
  page?: string;
  exactMatch?: string;
}

export const normalizeParam = (
  param: string | string[] | undefined
): string[] => (param ? (Array.isArray(param) ? param : [param]) : []);

const normalizeSingleParam = (
  param: string | string[] | undefined
): string | undefined => (Array.isArray(param) ? param[0] : param);

const getBaseUrl = () => {
  let baseUrl = "";
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else {
    baseUrl = "http://localhost:3000";
  }
  return baseUrl;
};

const fetchElements = async (searchParams: SearchParams) => {
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
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const normalizedParams: SearchParams = {
    q: normalizeSingleParam(searchParams.q),
    mainCat: searchParams.mainCat,
    secCat: searchParams.secCat,
    page: normalizeSingleParam(searchParams.page),
    exactMatch: normalizeSingleParam(searchParams.exactMatch),
  };
  const { elements, total } = await fetchElements(normalizedParams);

  return <HomeClientPage serverElements={elements} serverTotal={total} />;
}
