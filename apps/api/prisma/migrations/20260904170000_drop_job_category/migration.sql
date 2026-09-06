-- Offers that only matched secondary technologies are no longer wanted.
DELETE FROM "Job" WHERE "category" = 'OTHER';

-- DropIndex
DROP INDEX "Job_category_publishedAt_idx";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "category";

-- DropEnum
DROP TYPE "JobCategory";

-- CreateIndex
CREATE INDEX "Job_isRemote_publishedAt_idx" ON "Job"("isRemote", "publishedAt");
