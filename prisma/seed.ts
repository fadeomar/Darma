// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const elements = require("../data/elements.json");

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elementsArr = elements.elements.map((item: any) => ({
    ...item,
    shortDescription: item.description,
  }));
  await prisma.element.createMany({
    data: [...elementsArr],
  });
  console.log("Seeded database");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
