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

async function main() {
  const elements = await prisma.element.findMany({
    select: { id: true, title: true, slug: true },
  });

  for (const el of elements) {
    if (el.slug && el.slug.length > 0) continue;

    const base = slugify(el.title || "element");
    let slug = base || `element-${el.id.slice(0, 8)}`;

    // ensure uniqueness
    let i = 1;
    while (true) {
      const exists = await prisma.element.findUnique({ where: { slug } });
      if (!exists) break;
      i += 1;
      slug = `${base}-${i}`;
    }

    await prisma.element.update({
      where: { id: el.id },
      data: { slug },
    });

    console.log(`✅ ${el.id} -> ${slug}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
