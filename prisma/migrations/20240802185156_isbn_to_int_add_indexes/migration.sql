/*
  Warnings:

  - Changed the type of `isbn` on the `Book` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "isbn",
ADD COLUMN     "isbn" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "AlternateName_name_idx" ON "AlternateName"("name");

-- CreateIndex
CREATE INDEX "Author_name_idx" ON "Author"("name");

-- CreateIndex
CREATE INDEX "Book_isbn_idx" ON "Book"("isbn");

-- CreateIndex
CREATE INDEX "Book_workId_idx" ON "Book"("workId");
