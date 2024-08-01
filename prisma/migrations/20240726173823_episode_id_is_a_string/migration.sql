/*
  Warnings:

  - The primary key for the `Episode` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Episode" DROP CONSTRAINT "Episode_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Episode_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Episode_id_seq";

-- CreateIndex
CREATE INDEX "Episode_posted_idx" ON "Episode"("posted");
