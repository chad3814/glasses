-- CreateTable
CREATE TABLE "Metadata" (
    "id" SERIAL NOT NULL,
    "lastFeedFetch" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);
