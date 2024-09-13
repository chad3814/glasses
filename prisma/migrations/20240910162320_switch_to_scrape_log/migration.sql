/*
  Warnings:

  - You are about to drop the `Metadata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Metadata";

-- CreateTable
CREATE TABLE "ScrapeLog" (
    "url" TEXT NOT NULL,
    "lastFetch" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapeLog_pkey" PRIMARY KEY ("url")
);
