-- AlterTable
ALTER TABLE "Digest" ALTER COLUMN "safeId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Source" ALTER COLUMN "safeId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "safeId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WatchProgress" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;
