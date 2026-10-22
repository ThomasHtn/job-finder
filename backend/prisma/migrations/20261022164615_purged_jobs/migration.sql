-- CreateTable
CREATE TABLE "PurgedJob" (
    "source" "JobSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "purgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurgedJob_pkey" PRIMARY KEY ("source","sourceId")
);
