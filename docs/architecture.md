# Architecture and security boundaries

## Two explicit execution modes

The self-contained demo uses original seed records as read-only fixtures. Client-side cart state is normalized against known product IDs, integer quantities and fixture stock. Totals use integer paise. Checkout is an explicit simulation with no financial or inventory side effects. The server checks SACRED_DEMO_MODE; protected APIs return unavailable and the database factory refuses access in demo mode. No provider credentials are required.

The database-backed implementation uses Next.js server operations, Prisma and PostgreSQL, with Supabase Auth providing verified identities. Each protected operation resolves its actor server-side and rechecks ownership or ADMIN permission. Client-supplied role, audit actor, identity, price and authoritative stock are not trusted. Browser Supabase roles are not granted commerce-table access. Runtime permissions are restricted and sensitive profile-role changes are excluded.

## Data and transaction model

The Prisma schema and reviewed migrations define profiles linked to provider Auth users, categories, products, collections, persistent carts, orders with immutable purchased-price snapshots, simulated payment attempts and inventory audit movements. Checkout validates server data inside transactions; locking, nonnegative stock constraints, revision checks and idempotency prevent overselling, stale writes and duplicate processing. Fulfillment transitions cannot fabricate payment success. See the schema and transaction services for exact constraints.

## Trade-offs

- A separate self-contained demo preserves an interview walkthrough while hosted dependencies remain unverified. Local browser persistence deliberately does not claim database durability or authentication.
- Integer money and server-authoritative prices support auditable calculations in the database-backed path.
- PostgreSQL locks and transactions simplify inventory correctness at demo scale; operational scaling requires measured contention and independent production review.
- Guest-cart convenience in the demo is distinct from the authenticated persistent-cart architecture. An authenticated merge needs its own ownership, conflict and replay tests.
- Original self-hosted assets avoid third-party image dependencies and ambiguous brand rights.

## Environment and trust

Only public provider URL and publishable key may use NEXT_PUBLIC names. All private URLs and throttle secrets are server-only. For a separately approved hosted backend use a restricted runtime login and distinct private migration credentials, strict CA-chain and hostname validation, and an exact trusted HTTPS origin. No production endpoint, account, role credential or hosted topology is supplied here. The packaged certificate is a public trust anchor; it is not sufficient evidence of a verified live connection.
