-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "posted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "longTitle" TEXT,
    "isbn10" TEXT NOT NULL,
    "isbn13" TEXT NOT NULL,
    "deweyDecimal" TEXT,
    "binding" TEXT,
    "publisher" TEXT,
    "language" TEXT,
    "datePublished" TIMESTAMP(3),
    "edition" TEXT,
    "pages" INTEGER,
    "length" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "weight" INTEGER,
    "lengthUnit" TEXT,
    "widthUnit" TEXT,
    "heightUnit" TEXT,
    "weightUnit" TEXT,
    "overview" TEXT,
    "coverImage" TEXT,
    "msrp" DOUBLE PRECISION,
    "excerpt" TEXT,
    "synopsis" TEXT,
    "subjects" TEXT[],

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatedBook" (
    "bookIdA" INTEGER NOT NULL,
    "bookIdB" INTEGER NOT NULL,
    CONSTRAINT bookIdA_less_bookIdB CHECK( "bookIdA" < "bookIdB" )
);

-- CreateTable
CREATE TABLE "Author" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BookToEpisode" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AuthorToBook" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "Episode_posted_idx" ON "Episode"("posted");

-- CreateIndex
CREATE UNIQUE INDEX "RelatedBook_bookIdA_bookIdB_key" ON "RelatedBook"("bookIdA", "bookIdB");

-- CreateIndex
CREATE UNIQUE INDEX "_BookToEpisode_AB_unique" ON "_BookToEpisode"("A", "B");

-- CreateIndex
CREATE INDEX "_BookToEpisode_B_index" ON "_BookToEpisode"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AuthorToBook_AB_unique" ON "_AuthorToBook"("A", "B");

-- CreateIndex
CREATE INDEX "_AuthorToBook_B_index" ON "_AuthorToBook"("B");

-- AddForeignKey
ALTER TABLE "RelatedBook" ADD CONSTRAINT "RelatedBook_bookIdA_fkey" FOREIGN KEY ("bookIdA") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedBook" ADD CONSTRAINT "RelatedBook_bookIdB_fkey" FOREIGN KEY ("bookIdB") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookToEpisode" ADD CONSTRAINT "_BookToEpisode_A_fkey" FOREIGN KEY ("A") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookToEpisode" ADD CONSTRAINT "_BookToEpisode_B_fkey" FOREIGN KEY ("B") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuthorToBook" ADD CONSTRAINT "_AuthorToBook_A_fkey" FOREIGN KEY ("A") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuthorToBook" ADD CONSTRAINT "_AuthorToBook_B_fkey" FOREIGN KEY ("B") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
