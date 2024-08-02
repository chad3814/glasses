/*
  Warnings:

  - You are about to drop the `_BookToEpisode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BookToEpisode" DROP CONSTRAINT "_BookToEpisode_A_fkey";

-- DropForeignKey
ALTER TABLE "_BookToEpisode" DROP CONSTRAINT "_BookToEpisode_B_fkey";

-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "sortName" TEXT;

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "goodReadsUrl" TEXT,
ADD COLUMN     "openLibraryId" TEXT,
ADD COLUMN     "storyGraphUrl" TEXT;

-- AlterTable
ALTER TABLE "Work" ADD COLUMN     "openLibraryId" TEXT,
ADD COLUMN     "wikidataId" TEXT;

-- DropTable
DROP TABLE "_BookToEpisode";

-- CreateTable
CREATE TABLE "AlternateName" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "AlternateName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EpisodeToWork" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EpisodeToWork_AB_unique" ON "_EpisodeToWork"("A", "B");

-- CreateIndex
CREATE INDEX "_EpisodeToWork_B_index" ON "_EpisodeToWork"("B");

-- AddForeignKey
ALTER TABLE "AlternateName" ADD CONSTRAINT "AlternateName_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpisodeToWork" ADD CONSTRAINT "_EpisodeToWork_A_fkey" FOREIGN KEY ("A") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpisodeToWork" ADD CONSTRAINT "_EpisodeToWork_B_fkey" FOREIGN KEY ("B") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
