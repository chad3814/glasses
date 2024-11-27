-- CreateTable
CREATE TABLE "WordSearch" (
    "word" TEXT NOT NULL,
    "bookId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "WordSearch_pkey" PRIMARY KEY ("word","bookId")
);

-- AddForeignKey
ALTER TABLE "WordSearch" ADD CONSTRAINT "WordSearch_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
