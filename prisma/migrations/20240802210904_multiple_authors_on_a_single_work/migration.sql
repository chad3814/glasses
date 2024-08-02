/*
  Warnings:

  - You are about to drop the column `authorId` on the `Work` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Work" DROP CONSTRAINT "Work_authorId_fkey";

-- DropIndex
DROP INDEX "Work_title_authorId_key";

-- AlterTable
ALTER TABLE "Work" DROP COLUMN "authorId";

-- CreateTable
CREATE TABLE "_AuthorToWork" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AuthorToWork_AB_unique" ON "_AuthorToWork"("A", "B");

-- CreateIndex
CREATE INDEX "_AuthorToWork_B_index" ON "_AuthorToWork"("B");

-- AddForeignKey
ALTER TABLE "_AuthorToWork" ADD CONSTRAINT "_AuthorToWork_A_fkey" FOREIGN KEY ("A") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuthorToWork" ADD CONSTRAINT "_AuthorToWork_B_fkey" FOREIGN KEY ("B") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
