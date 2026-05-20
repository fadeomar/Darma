import { NextResponse } from "next/server";
import { searchElementsDTO } from "@/server/services/search.service";

function normalizeList(values: string[]) {
  return values.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
}

function parsePositiveInt(value: string | null, fallback: number, max = 100) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(max, Math.floor(parsed));
}

function normalizeSort(value: string | null) {
  switch (value) {
    case "oldest":
    case "titleAsc":
    case "titleDesc":
    case "newest":
      return value;
    default:
      return "newest";
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q")?.trim() || undefined;
  const exactMatch = searchParams.get("exactMatch") === "true";
  const mainCategory = normalizeList(searchParams.getAll("mainCat"));
  const secondaryCategory = normalizeList(searchParams.getAll("secCat"));
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 12);
  const sort = normalizeSort(searchParams.get("sort"));

  try {
    const result = await searchElementsDTO({
      q,
      exactMatch,
      mainCategory,
      secondaryCategory,
      page,
      pageSize,
      sort,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search API failed:", error);
    return NextResponse.json(
      { items: [], total: 0, page, pageSize, error: "Failed to search elements" },
      { status: 500 },
    );
  }
}
