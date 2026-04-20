import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@darma.com")
    .trim()
    .toLowerCase();
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "change-me-now";

  const passwordHash = await bcryptjs.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { username, password: passwordHash, role: "admin" },
    create: { email, username, password: passwordHash, role: "admin" },
  });

  console.log(`✅ Admin ensured: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
