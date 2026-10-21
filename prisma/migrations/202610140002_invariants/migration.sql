-- Additional invariants not expressible in Prisma's schema.
-- Supabase provides auth.users. Local integration supplies an explicit UUID-only
-- test fixture; a missing Auth table is an error, never a skipped ownership FK.
ALTER TABLE commerce."Profile" ADD CONSTRAINT "Profile_auth_user_fkey"
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE commerce."Product"
  ADD CONSTRAINT "Product_price_check" CHECK ("pricePaise" BETWEEN 1 AND 10000000),
  ADD CONSTRAINT "Product_stock_check" CHECK (stock >= 0),
  ADD CONSTRAINT "Product_version_check" CHECK (version >= 0),
  ADD CONSTRAINT "Product_comparison_check" CHECK ("compareAtPricePaise" IS NULL OR ("compareAtPricePaise" > "pricePaise" AND "compareAtPricePaise" <= 10000000)),
  ADD CONSTRAINT "Product_active_content_check" CHECK (NOT active OR (
    length(trim(name)) > 0 AND length(trim(description)) > 0 AND
    length(trim(material)) > 0 AND length(trim(dimensions)) > 0 AND
    length(trim(care)) > 0 AND length(trim("includedContents")) > 0)),
  ADD CONSTRAINT "Product_occasion_check" CHECK (
    cardinality("occasionTags") BETWEEN 1 AND 5 AND array_position("occasionTags",NULL) IS NULL AND
    "occasionTags" <@ ARRAY['navratri','housewarming','everyday']::text[]),
  ADD CONSTRAINT "Product_intent_check" CHECK (
    cardinality("intentTags") BETWEEN 1 AND 5 AND array_position("intentTags",NULL) IS NULL AND
    "intentTags" <@ ARRAY['gifting','ritual','home','reading','self_care']::text[]);

CREATE FUNCTION commerce.unique_tags(tags text[]) RETURNS boolean
LANGUAGE SQL IMMUTABLE STRICT AS $$
  SELECT count(*) = count(DISTINCT tag) FROM unnest(tags) AS tag;
$$;
ALTER TABLE commerce."Product" ADD CONSTRAINT "Product_unique_tags_check"
  CHECK (commerce.unique_tags("occasionTags") AND commerce.unique_tags("intentTags"));

ALTER TABLE commerce."ProductCollection" ADD CONSTRAINT "ProductCollection_position_check" CHECK (position >= 0);
ALTER TABLE commerce."Cart" ADD CONSTRAINT "Cart_revision_check" CHECK (revision >= 0);
ALTER TABLE commerce."CartItem" ADD CONSTRAINT "CartItem_quantity_check" CHECK (quantity BETWEEN 1 AND 10);
ALTER TABLE commerce."Order"
  ADD CONSTRAINT "Order_revision_check" CHECK ("sourceCartRevision" >= 0),
  ADD CONSTRAINT "Order_currency_check" CHECK (currency = 'INR'),
  ADD CONSTRAINT "Order_total_check" CHECK (
    "subtotalPaise" >= 0 AND "shippingPaise" >= 0 AND "taxPaise" >= 0 AND "totalPaise" >= 0 AND
    "totalPaise"::bigint = "subtotalPaise"::bigint + "shippingPaise"::bigint + "taxPaise"::bigint);
CREATE UNIQUE INDEX "Order_successful_cart_revision_key"
  ON commerce."Order" ("cartId", "sourceCartRevision")
  WHERE status IN ('CONFIRMED','SHIPPED','DELIVERED');
ALTER TABLE commerce."OrderItem"
  ADD CONSTRAINT "OrderItem_quantity_check" CHECK (quantity BETWEEN 1 AND 10),
  ADD CONSTRAINT "OrderItem_price_check" CHECK ("unitPricePaise" BETWEEN 1 AND 10000000),
  ADD CONSTRAINT "OrderItem_total_check" CHECK ("lineTotalPaise"::bigint = "unitPricePaise"::bigint * quantity);
ALTER TABLE commerce."PaymentAttempt"
  ADD CONSTRAINT "PaymentAttempt_amount_check" CHECK ("amountPaise" >= 0),
  ADD CONSTRAINT "PaymentAttempt_currency_check" CHECK (currency='INR');
ALTER TABLE commerce."InventoryMovement"
  ADD CONSTRAINT "InventoryMovement_delta_check" CHECK (delta <> 0),
  ADD CONSTRAINT "InventoryMovement_balance_check" CHECK ("balanceAfter" >= 0),
  ADD CONSTRAINT "InventoryMovement_actor_check" CHECK ("actorId" IS NOT NULL OR reason='INITIAL_SEED');
ALTER TABLE commerce."RequestBucket" ADD CONSTRAINT "RequestBucket_count_check" CHECK (count >= 0);

REVOKE ALL ON SCHEMA commerce FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA commerce FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA commerce FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce REVOKE ALL ON FUNCTIONS FROM PUBLIC;
-- Supabase browser roles exist on Supabase but need not exist in vanilla PG.
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON SCHEMA commerce FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA commerce FROM anon;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON SCHEMA commerce FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA commerce FROM authenticated;
  END IF;
END $$;
