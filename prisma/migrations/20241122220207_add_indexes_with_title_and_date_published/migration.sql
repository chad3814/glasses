-- CreateIndex
CREATE INDEX "Book_title_datePublished_idx" ON "Book"("title", "datePublished");

-- CreateIndex
CREATE INDEX "Book_longTitle_datePublished_idx" ON "Book"("longTitle", "datePublished");
