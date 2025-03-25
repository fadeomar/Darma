import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CodeElement } from "@/types";

interface SearchResult extends CodeElement {
  score?: number;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const q = searchParams.get("q")?.trim() || null;
    const mainCats = searchParams.getAll("mainCat").filter(Boolean);
    const secCats = searchParams.getAll("secCat").filter(Boolean);
    const exactMatch = searchParams.get("exactMatch") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "6", 10);
    const offset = (page - 1) * pageSize;

    const queryParams: (string | string[])[] = [];
    const whereConditions: string[] = [];
    const baseQuery = `SELECT * FROM "Element"`;

    // Query when q is provided
    if (q) {
      queryParams.push(exactMatch ? q : `%${q}%`);
      const textConditions = exactMatch
        ? [
            `title = $1`,
            `description = $1`,
            `"shortDescription" = $1`,
            `$1 = ANY("mainCategory")`,
            `$1 = ANY("secondaryCategory")`,
          ]
        : [
            `title ILIKE $1`,
            `description ILIKE $1`,
            `"shortDescription" ILIKE $1`,
            `EXISTS (SELECT 1 FROM unnest("mainCategory") cat WHERE cat ILIKE $1)`,
            `EXISTS (SELECT 1 FROM unnest("secondaryCategory") cat WHERE cat ILIKE $1)`,
          ];
      whereConditions.push(`(${textConditions.join(" OR ")})`);
      if (mainCats.length > 0 || secCats.length > 0) {
        console.log("Main categories provided:", mainCats);
        console.log("Secondary categories provided:", secCats);
      }
    }
    // Query when q is not provided
    else if (mainCats.length > 0 || secCats.length > 0) {
      const conditions: string[] = [];
      if (mainCats.length > 0) {
        queryParams.push(mainCats);
        conditions.push(`"mainCategory" && $1`);
      }
      if (secCats.length > 0) {
        const secCatIndex = mainCats.length > 0 ? 2 : 1;
        queryParams.push(secCats);
        conditions.push(`"secondaryCategory" && $${secCatIndex}`);
      }
      if (conditions.length > 0) {
        whereConditions.push(`(${conditions.join(" OR ")})`);
      }
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Fetch all matching items (no LIMIT/OFFSET here)
    const fetchQuery = `${baseQuery} ${whereClause}`;
    const elementsRaw: CodeElement[] = await prisma.$queryRawUnsafe(
      fetchQuery,
      ...queryParams
    );

    // Count total items
    const countQuery = `SELECT COUNT(*)::int as count FROM "Element" ${whereClause}`;
    const countResult: { count: number }[] = await prisma.$queryRawUnsafe(
      countQuery,
      ...queryParams
    );
    const total = countResult[0]?.count || 0;

    // Transform raw results
    const elements: SearchResult[] = elementsRaw.map((el) => ({
      ...el,
      shortDescription: el.shortDescription,
      mainCategory: el.mainCategory,
      secondaryCategory: el.secondaryCategory,
      createdAt: new Date(el.createdAt),
      updatedAt: new Date(el.updatedAt),
    }));

    // Scoring function
    const computeScore = (element: SearchResult): number => {
      let score = 0;
      if (q) {
        const qLower = q.toLowerCase();
        if (element.title.toLowerCase().includes(qLower)) score += 1;
        if (
          element.description &&
          element.description.toLowerCase().includes(qLower)
        )
          score += 1;
        if (
          element.shortDescription &&
          element.shortDescription.toLowerCase().includes(qLower)
        )
          score += 1;
        if (
          element.tags &&
          element.tags.some((tag) => tag.toLowerCase() === qLower)
        )
          score += 1;
        if (
          element.mainCategory &&
          element.mainCategory.some((cat) => cat.toLowerCase() === qLower)
        )
          score += 1;
        if (
          element.secondaryCategory &&
          element.secondaryCategory.some((cat) => cat.toLowerCase() === qLower)
        )
          score += 1;
      }
      if (mainCats.length > 0) {
        mainCats.forEach((mainCat) => {
          if (element.mainCategory.includes(mainCat)) score += 1;
        });
      }
      if (secCats.length > 0) {
        secCats.forEach((secCat) => {
          if (element.secondaryCategory.includes(secCat)) score += 1;
        });
      }
      return score;
    };

    // Apply scoring and sorting
    const scoredElements = elements.map((el) => ({
      ...el,
      score: computeScore(el),
    }));
    scoredElements.sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (
        b.createdAt.getTime() - a.createdAt.getTime() // Fallback to createdAt DESC
      );
    });

    // Apply pagination
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
