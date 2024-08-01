-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "episodeIds" INTEGER[];

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "bookIds" INTEGER[];

-- CreateTable
CREATE TABLE "_BookToEpisode" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BookToEpisode_AB_unique" ON "_BookToEpisode"("A", "B");

-- CreateIndex
CREATE INDEX "_BookToEpisode_B_index" ON "_BookToEpisode"("B");

-- AddForeignKey
ALTER TABLE "_BookToEpisode" ADD CONSTRAINT "_BookToEpisode_A_fkey" FOREIGN KEY ("A") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookToEpisode" ADD CONSTRAINT "_BookToEpisode_B_fkey" FOREIGN KEY ("B") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
