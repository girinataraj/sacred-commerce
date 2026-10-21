-- Applied only by privileged migration tooling. Runtime and browser roles never
-- acquire auth/schema ownership, role management or profile-role writes.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='commerce_app') THEN
    CREATE ROLE commerce_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='commerce_app' AND
    (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls)) THEN
    RAISE EXCEPTION 'commerce_app must be a restricted non-login role';
  END IF;
END $$;
REVOKE ALL ON SCHEMA commerce FROM commerce_app;
REVOKE ALL ON ALL TABLES IN SCHEMA commerce FROM commerce_app;
GRANT USAGE ON SCHEMA commerce TO commerce_app;
GRANT SELECT ON ALL TABLES IN SCHEMA commerce TO commerce_app;
GRANT INSERT (id,"updatedAt") ON commerce."Profile" TO commerce_app;
-- Categories, collections and memberships are seeded/read-only in this MVP.
GRANT INSERT, UPDATE, DELETE ON commerce."CartItem" TO commerce_app;
GRANT INSERT, UPDATE ON commerce."Product",commerce."Cart",commerce."RequestBucket" TO commerce_app;
GRANT INSERT ON commerce."Order",commerce."OrderItem",commerce."PaymentAttempt",commerce."InventoryMovement",commerce."AuditEvent" TO commerce_app;
GRANT UPDATE (status,"updatedAt") ON commerce."Order" TO commerce_app;
GRANT EXECUTE ON FUNCTION commerce.unique_tags(text[]) TO commerce_app;
DO $$ DECLARE browser_role text; BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname=browser_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA commerce FROM %I',browser_role);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA commerce FROM %I',browser_role);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA commerce FROM %I',browser_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA commerce REVOKE ALL ON TABLES FROM %I',browser_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA commerce REVOKE ALL ON FUNCTIONS FROM %I',browser_role);
    END IF;
  END LOOP;
END $$;
