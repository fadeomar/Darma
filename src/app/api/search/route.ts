import { NextResponse } from "next/server";
import { z } from "zod";
import { searchElementsDTO } from "@/server/services/search.service";

const searchQuerySchema = z.object({
  q: z.string().optional(),
  exactMatch: z.enum(["true", "false"]).optional().default("false"),
  mainCategory: z.array(z.string()).default([]),
  secondaryCategory: z.array(z.string()).default([]),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  sort: z.enum(["newest", "oldest", "titleAsc", "titleDesc"]).default("newest"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const parsed = searchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    exactMatch: searchParams.get("exactMatch") ?? "false",
    mainCategory: searchParams.getAll("mainCat"),
    secondaryCategory: searchParams.getAll("secCat"),
    page: searchParams.get("page") ?? "1",
    pageSize: searchParams.get("pageSize") ?? "12",
    sort: searchParams.get("sort") ?? "newest",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search query" }, { status: 400 });
  }

  const result = await searchElementsDTO({
    q: parsed.data.q,
    exactMatch: parsed.data.exactMatch === "true",
    mainCategory: parsed.data.mainCategory,
    secondaryCategory: parsed.data.secondaryCategory,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
    sort: parsed.data.sort,
  });

  return NextResponse.json(result);
}
