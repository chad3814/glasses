/*
  Warnings:

  - A unique constraint covering the columns `[title,authorId]` on the table `Work` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Work_title_authorId_key" ON "Work"("title", "authorId");
