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

const getBaseUrl = () => {
  let baseUrl = "";
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`; // Ensure HTTPS for Vercel
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
  searchParams: SearchParams; // No Promise here
}) {
  const { elements, total } = await fetchElements(searchParams);

  return <HomeClientPage serverElements={elements} serverTotal={total} />;
}
