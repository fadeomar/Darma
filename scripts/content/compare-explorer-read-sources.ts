import { readFile } from "node:fs/promises";
import path from "node:path";

function sanitizeError(error: unknown): string {
  let message = error instanceof Error ? error.message : String(error);
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) message = message.split(databaseUrl).join("[redacted]");
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted]");
}

async function loadEnvironment(): Promise<void> {
  const envFile = process.env.ENV_FILE?.trim() || ".env.local";
  const envPath = path.resolve(process.cwd(), envFile);
  const source = await readFile(envPath, "utf8");

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7) : line;
    const separator = normalized.indexOf("=");
    if (separator <= 0) continue;

    const key = normalized.slice(0, separator).trim();
    let value = normalized.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizeElement(element: any) {
  if (!element) return null;
  return {
    ...element,
    createdAt: element.createdAt.toISOString(),
    updatedAt: element.updatedAt.toISOString(),
  };
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function deriveWords(values: Array<string | null | undefined>, limit: number): string[] {
  const words: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const matches = value.match(/[\p{L}\p{N}]{3,}/gu) ?? [];
    for (const word of matches) {
      if (!words.includes(word)) words.push(word);
      if (words.length >= limit) return words;
    }
  }
  return words;
}

async function main(): Promise<void> {
  await loadEnvironment();

  const [
    { buildElementSearchSpec },
    { ElementJsonRepository },
    { ElementPrismaRepository },
    { prisma },
  ] = await Promise.all([
    import("../../src/features/elements/domain/search/elementSearch.spec"),
    import("../../src/features/elements/infra/json/elementJson.repository"),
    import("../../src/features/elements/infra/prisma/elementPrisma.repository"),
    import("../../src/server/db/prisma"),
  ]);

  const databaseRepository = new ElementPrismaRepository();
  const jsonRepository = new ElementJsonRepository();
  let idMismatches = 0;
  let fieldMismatches = 0;
  let sortComparisons = 0;
  let categoryComparisons = 0;
  let queryComparisons = 0;

  const searchAll = async (repository: any, input: any) => {
    const first = await repository.search(
      buildElementSearchSpec({
        ...input,
        pagination: { page: 1, pageSize: 100 },
        visibility: { mode: "public" },
      }),
    );
    const items = [...first.items];
    const pages = Math.ceil(first.total / first.pageSize);
    for (let page = 2; page <= pages; page += 1) {
      const next = await repository.search(
        buildElementSearchSpec({
          ...input,
          pagination: { page, pageSize: 100 },
          visibility: { mode: "public" },
        }),
      );
      items.push(...next.items);
    }
    return { items, total: first.total };
  };

  const compareSearch = async (input: any): Promise<boolean> => {
    const [databaseResult, jsonResult] = await Promise.all([
      searchAll(databaseRepository, input),
      searchAll(jsonRepository, input),
    ]);
    const databaseIds = databaseResult.items.map((item: any) => item.id);
    const jsonIds = jsonResult.items.map((item: any) => item.id);
    const matches =
      databaseResult.total === jsonResult.total &&
      valuesEqual(databaseIds, jsonIds);
    if (!matches) idMismatches += 1;
    return matches;
  };

  const [databasePublic, jsonPublic] = await Promise.all([
    searchAll(databaseRepository, { sort: "newest" }),
    searchAll(jsonRepository, { sort: "newest" }),
  ]);
  if (databasePublic.total !== jsonPublic.total) idMismatches += 1;

  for (const sort of ["newest", "oldest", "titleAsc", "titleDesc"] as const) {
    if (await compareSearch({ sort })) sortComparisons += 1;
  }

  const publicIds = databasePublic.items.map((item: any) => item.id);
  for (const id of publicIds) {
    const [databaseElement, jsonElement] = await Promise.all([
      databaseRepository.getById(id),
      jsonRepository.getById(id),
    ]);
    if (!databaseElement || !jsonElement) {
      idMismatches += 1;
    } else if (
      !valuesEqual(normalizeElement(databaseElement), normalizeElement(jsonElement))
    ) {
      fieldMismatches += 1;
    }
  }

  const publicSlugs = unique(
    databasePublic.items
      .map((item: any) => item.slug)
      .filter((slug: unknown): slug is string => typeof slug === "string"),
  );
  for (const slug of publicSlugs) {
    const [databaseElement, jsonElement] = await Promise.all([
      databaseRepository.getBySlug(slug),
      jsonRepository.getBySlug(slug),
    ]);
    if (!databaseElement || !jsonElement) {
      idMismatches += 1;
    } else if (
      !valuesEqual(normalizeElement(databaseElement), normalizeElement(jsonElement))
    ) {
      fieldMismatches += 1;
    }
  }

  const mainCategories = unique(
    databasePublic.items.flatMap((item: any) => item.mainCategory),
  ).sort();
  for (const mainCategory of mainCategories) {
    const searchMatches = await compareSearch({
      filters: { mainCategory: [mainCategory] },
      sort: "newest",
    });
    const [databaseSecondary, jsonSecondary] = await Promise.all([
      databaseRepository.getPublicSecondaryCategories(mainCategory),
      jsonRepository.getPublicSecondaryCategories(mainCategory),
    ]);
    const secondaryMatches = valuesEqual(databaseSecondary, jsonSecondary);
    if (!secondaryMatches) idMismatches += 1;
    if (searchMatches && secondaryMatches) categoryComparisons += 1;
  }

  const exactTitles = unique(
    databasePublic.items.map((item: any) => item.title),
  ).slice(0, 3);
  const titleWords = deriveWords(
    databasePublic.items.map((item: any) => item.title),
    3,
  );
  const descriptionWords = deriveWords(
    databasePublic.items.map((item: any) => item.description),
    3,
  );
  const shortDescriptionWords = deriveWords(
    databasePublic.items.map((item: any) => item.shortDescription),
    3,
  );
  const tags = unique(databasePublic.items.flatMap((item: any) => item.tags)).slice(
    0,
    3,
  );

  const queryCases = [
    ...exactTitles.map((q) => ({ filters: { q, exactMatch: true } })),
    ...titleWords.map((q) => ({ filters: { q } })),
    ...descriptionWords.map((q) => ({ filters: { q } })),
    ...shortDescriptionWords.map((q) => ({
      filters: { q, includeShortDescription: true },
    })),
    ...tags.map((q) => ({ filters: { q } })),
  ];
  for (const queryCase of queryCases) {
    if (await compareSearch({ ...queryCase, sort: "newest" })) {
      queryComparisons += 1;
    }
  }

  const passed = idMismatches === 0 && fieldMismatches === 0;
  console.log(`Explorer read-source parity: ${passed ? "PASS" : "FAIL"}`);
  console.log(`Public items: ${databasePublic.total}`);
  console.log(`Sort comparisons: ${sortComparisons} passed`);
  console.log(`Category comparisons: ${categoryComparisons} passed`);
  console.log(`Query comparisons: ${queryComparisons} passed`);
  console.log(`ID mismatches: ${idMismatches}`);
  console.log(`Field mismatches: ${fieldMismatches}`);

  await prisma.$disconnect();
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Explorer read-source parity: FAIL");
  console.error(sanitizeError(error));
  process.exitCode = 1;
});
