-- lastSeenAt now moves with the ingestion only: a view or a star no longer delays the purge.
ALTER TABLE "Job" ALTER COLUMN "lastSeenAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Every per-source history query filters on the source, then sorts by start.
CREATE INDEX "IngestionRun_source_startedAt_idx" ON "IngestionRun"("source", "startedAt");
