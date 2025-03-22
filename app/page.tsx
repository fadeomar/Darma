// app/page.tsx (Server Component)
import HomeClientPage from "@/sections/HomeClientPage";

interface SearchParams {
  q?: string;
  mainCat?: string | string[];
  secCat?: string | string[];
  page?: string;
}

async function getInitialData(searchParams: Promise<SearchParams>) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams();

  if (resolvedParams.q) params.set("q", resolvedParams.q);

  const mainCats = Array.isArray(resolvedParams.mainCat)
    ? resolvedParams.mainCat
    : [resolvedParams.mainCat].filter((c): c is string => !!c);
  mainCats.forEach((c) => params.append("mainCat", c));

  const secCats = Array.isArray(resolvedParams.secCat)
    ? resolvedParams.secCat
    : [resolvedParams.secCat].filter((c): c is string => !!c);
  secCats.forEach((c) => params.append("secCat", c));

  const page = resolvedParams.page || "1";
  params.set("page", page);
  params.set("pageSize", "6");

  try {
    let baseUrl = "";
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    } else if (process.env.VERCEL_URL) {
      baseUrl = process.env.VERCEL_URL;
    } else {
      baseUrl = "http://localhost:3000";
    }
    const response = await fetch(`${baseUrl}/api/search?${params.toString()}`);
    return await response.json();
  } catch (error) {
    console.error("Server fetch error:", error);
    return { elements: [], total: 0 };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams; // Resolve the Promise here
  const { elements, total } = await getInitialData(searchParams);

  return (
    <HomeClientPage
      serverElements={elements}
      serverTotal={total}
      searchParams={resolvedParams} // Pass resolved object instead of Promise
    />
  );
}
