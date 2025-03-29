import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CodeElement } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const q = searchParams.get("q")?.trim() || null;
    const mainCats = searchParams.getAll("mainCat").filter(Boolean);
    const exactMatch = searchParams.get("exactMatch") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "6", 10);
    const offset = (page - 1) * pageSize;

    const queryParams: string[] = [];
    const whereConditions: string[] = [];
    let paramIndex = 1;

    // Text Search Condition
    if (q) {
      const searchParam = exactMatch ? q : `%${q.toLowerCase()}%`;
      queryParams.push(searchParam);

      const textConditions = [];
      if (exactMatch) {
        textConditions.push(
          `title = $${paramIndex}`,
          `description = $${paramIndex}`,
          `"shortDescription" = $${paramIndex}`,
          `$${paramIndex} = ANY(tags::text[])`
        );
      } else {
        textConditions.push(
          `LOWER(title) LIKE $${paramIndex}`,
          `LOWER(description) LIKE $${paramIndex}`,
          `LOWER("shortDescription") LIKE $${paramIndex}`,
          `EXISTS (SELECT 1 FROM unnest(tags::text[]) tag WHERE LOWER(tag) LIKE $${paramIndex})`
        );
      }
      whereConditions.push(`(${textConditions.join(" OR ")})`);
      paramIndex++;
    }

    // Category Condition
    if (mainCats.length > 0) {
      const escapedCats = mainCats
        .map((c) => `'${c.replace(/'/g, "''")}'`)
        .join(", ");
      const arrayLiteral = `ARRAY[${escapedCats}]::text[]`;
      const operator = exactMatch ? "@>" : "&&"; // @> for exact containment, && for overlap
      whereConditions.push(`"mainCategory" ${operator} ${arrayLiteral}`);
    }

    // Combine conditions based on exactMatch
    const conjunction = exactMatch ? " AND " : " OR ";
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(conjunction)}`
        : "";
    const baseQuery = `SELECT * FROM "Element" ${whereClause}`;

    // Execute the query
    const elementsRaw: CodeElement[] = await prisma.$queryRawUnsafe(
      baseQuery,
      ...queryParams
    );
    const total = elementsRaw.length;

    // Scoring Function
    const computeScore = (element: CodeElement): number => {
      let score = 0;
      const qLower = q?.toLowerCase();

      if (qLower) {
        if (element.title.toLowerCase().includes(qLower)) score += 3;
        if (element.description?.toLowerCase().includes(qLower)) score += 2;
        if (element.shortDescription?.toLowerCase().includes(qLower))
          score += 1;
        if (element.tags?.some((t) => t.toLowerCase().includes(qLower)))
          score += 2;
      }

      mainCats.forEach((cat) => {
        if (element.mainCategory?.includes(cat)) score += 3;
      });

      return score;
    };

    // Sort and paginate results
    const scoredElements = elementsRaw
      .map((el) => ({ ...el, score: computeScore(el) }))
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        return scoreDiff !== 0
          ? scoreDiff
          : b.createdAt.getTime() - a.createdAt.getTime();
      });

    const paginatedElements = scoredElements.slice(offset, offset + pageSize);

    return NextResponse.json({
      success: true,
      elements: paginatedElements,
      total,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
