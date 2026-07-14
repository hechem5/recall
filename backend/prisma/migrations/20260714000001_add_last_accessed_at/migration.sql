-- AlterTable
ALTER TABLE "Source" ADD COLUMN "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill
UPDATE "Source" SET "lastAccessedAt" = "createdAt";

-- AlterTable
ALTER TABLE "Digest" ADD COLUMN "orphanedSourceIds" TEXT;
