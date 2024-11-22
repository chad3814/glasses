/*
  Warnings:

  - A unique constraint covering the columns `[isbn10]` on the table `Book` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[isbn13]` on the table `Book` will be added. If there are existing duplicate values, this will fail.

*/

DELETE FROM "Book" "a"
USING "Book" "b"
WHERE a.id > b.id
    AND a.isbn10 = b.isbn10;

DELETE FROM "Book" "a"
USING "Book" "b"
WHERE a.id > b.id
    AND a.isbn13 = b.isbn13;

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_longTitle_idx" ON "Book"("longTitle");

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn10_key" ON "Book"("isbn10");

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn13_key" ON "Book"("isbn13");
