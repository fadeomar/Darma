import { prisma } from "../src/server/db/prisma";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(fn: () => Promise<T>, label: string, max = 8) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = Math.min(15_000, 500 * Math.pow(2, attempt - 1));
      console.error(
        `⚠️ ${label} failed (attempt ${attempt}/${max}). retry in ${wait}ms`,
      );
      console.error(e);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function main() {
  const batchSize = 50;

  while (true) {
    const elements = await withRetry(
      () =>
        prisma.element.findMany({
          where: { OR: [{ slug: null }, { slug: "" }] },
          select: { id: true, title: true },
          take: batchSize,
          orderBy: { createdAt: "asc" },
        }),
      "findMany",
    );

    if (elements.length === 0) {
      console.log("✅ Done. No more elements missing slug.");
      break;
    }

    for (const el of elements) {
      const base = slugify(el.title || "element") || "element";
      let slug = base;

      // ensure uniqueness
      let i = 1;
      while (true) {
        const exists = await withRetry(
          () =>
            prisma.element.findUnique({
              where: { slug },
              select: { id: true },
            }),
          "findUnique(slug)",
        );
        if (!exists) break;
        i += 1;
        slug = `${base}-${i}`;
      }

      await withRetry(
        () =>
          prisma.element.update({
            where: { id: el.id },
            data: { slug },
          }),
        `update(${el.id})`,
      );

      console.log(`✅ ${el.id} -> ${slug}`);
      await sleep(50); // small throttle to be nice to Neon
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
