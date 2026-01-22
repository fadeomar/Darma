import { NextRequest, NextResponse } from "next/server";
import { searchElements } from "@/server/services/search.service";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const q = url.searchParams.get("q") || undefined;
  const mainCat = url.searchParams.getAll("mainCat").filter(Boolean);
  const exactMatch = url.searchParams.get("exactMatch") === "true";
  const sort =
    (url.searchParams.get("sort") as "createdAt" | "updatedAt") || "createdAt";
  const order = (url.searchParams.get("order") as "asc" | "desc") || "desc";
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 6);

  const { elements, total } = await searchElements({
    q,
    mainCat,
    exactMatch,
    sort,
    order,
    page,
    pageSize,
  });

  return NextResponse.json({
    success: true,
    elements,
    total,
    page,
    pageSize,
  });
}
