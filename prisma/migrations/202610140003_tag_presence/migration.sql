-- PostgreSQL CHECK constraints allow UNKNOWN. NULL scalar-list columns must
-- be independently rejected; preserve the previous executed migrations.
ALTER TABLE commerce."Product"
  ALTER COLUMN "occasionTags" SET NOT NULL,
  ALTER COLUMN "intentTags" SET NOT NULL;
