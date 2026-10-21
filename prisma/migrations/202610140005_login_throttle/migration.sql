CREATE TABLE commerce."LoginRequestBucket" (
  "keyHash" varchar(64) NOT NULL,
  "windowStart" timestamptz(3) NOT NULL,
  count integer NOT NULL,
  "createdAt" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamptz(3) NOT NULL,
  PRIMARY KEY ("keyHash","windowStart"),
  CHECK ("keyHash" ~ '^[a-f0-9]{64}$'),
  CHECK (count BETWEEN 1 AND 31)
);
REVOKE ALL ON commerce."LoginRequestBucket" FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON commerce."LoginRequestBucket" TO commerce_app;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON commerce."LoginRequestBucket" FROM anon;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON commerce."LoginRequestBucket" FROM authenticated;
  END IF;
END $$;
