-- Coordinates only serve the area check at ingestion: they were stored but never read.
ALTER TABLE "Job" DROP COLUMN "latitude",
DROP COLUMN "longitude";
