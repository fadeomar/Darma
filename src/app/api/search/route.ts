import { NextRequest, NextResponse } from "next/server";
import { searchElements } from "@/server/services/search.service";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const q = url.searchParams.get("q") || undefined;
  const mainCat = url.searchParams.getAll("mainCat").filter(Boolean);
  const secCat = url.searchParams.getAll("secCat").filter(Boolean);

  const exactMatch = url.searchParams.get("exactMatch") === "true";
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 6);

  const sort =
    (url.searchParams.get("sort") as "createdAt" | "updatedAt") || "createdAt";
  const order = (url.searchParams.get("order") as "asc" | "desc") || "desc";

  const result = await searchElements({
    q,
    mainCat,
    secCat,
    exactMatch,
    page,
    pageSize,
    sort,
    order,
  });

  return NextResponse.json(result);
}
