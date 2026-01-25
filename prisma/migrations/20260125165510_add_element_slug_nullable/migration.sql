/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Element` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Element" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updateUt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Element_slug_key" ON "Element"("slug");
