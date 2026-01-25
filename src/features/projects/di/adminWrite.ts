import { prisma } from "@/server/db/prisma";
import { PrismaElementRepository } from "../repository/prismaElementRepository";
import { ElementWriteService } from "../application/elementWriteService";

export function makeElementWriteService() {
  const repo = new PrismaElementRepository();
  return new ElementWriteService(prisma, repo);
}
