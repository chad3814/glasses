-- CreateEnum
CREATE TYPE "Format" AS ENUM ('hardcover', 'paperback', 'audio', 'ebook');

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "posted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "isbn" TEXT NOT NULL,
    "format" "Format" NOT NULL,
    "imageUrl" TEXT,
    "bookshopUrl" TEXT,
    "overdriveUrl" TEXT,
    "libroFmUrl" TEXT,
    "workId" INTEGER NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Work_title_idx" ON "Work"("title");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
