import { NextResponse } from "next/server";
import { searchElementsDTO } from "@/server/services/search.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? undefined;
  const exactMatch = searchParams.get("exactMatch") === "true";

  const mainCategory = searchParams.getAll("mainCat");
  const secondaryCategory = searchParams.getAll("secCat");

  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "12");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sort = (searchParams.get("sort") as any) ?? "newest";

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
    console.error("Search API failed", error);

    return NextResponse.json(
      {
        items: [],
        total: 0,
        page,
        pageSize,
        error:
          "Could not connect to the database. Check DATABASE_URL/Neon connection and try again.",
      },
      { status: 503 },
    );
  }
}
