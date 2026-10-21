-- AlterEnum
ALTER TYPE "JobCategory" ADD VALUE 'NEARBY';

-- AlterEnum
ALTER TYPE "JobSourceType" ADD VALUE 'EURES';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "isLocationApproximate" BOOLEAN NOT NULL DEFAULT false;
