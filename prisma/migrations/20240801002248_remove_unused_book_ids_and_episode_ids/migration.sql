/*
  Warnings:

  - You are about to drop the column `episodeIds` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `bookIds` on the `Episode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "episodeIds";

-- AlterTable
ALTER TABLE "Episode" DROP COLUMN "bookIds";
