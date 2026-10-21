-- Hidden offers go for good: the purge now goes by age, so nothing needs hiding any more.
DELETE FROM "Job" WHERE "isHidden" = true AND "isFavorite" = false;

ALTER TABLE "Job" DROP COLUMN "isHidden",
DROP COLUMN "lastSeenAt";
