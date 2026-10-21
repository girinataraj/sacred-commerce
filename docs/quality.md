# Quality and acceptance scope

The original acceptance criteria are preserved verbatim below. Their IDs do not become PASS merely because a related test exists. Local database-backed tests, provider mocks, self-contained browser tests, hosted checks and deployed checks are separate evidence categories. Historical local evidence is not a fresh run of this publication checkout.

| ID | Original action → expected result |
|---|---|
| TC01 | Open the homepage → Homepage loads successfully |
| TC02 | Search for a product → Matching products are displayed |
| TC03 | Add a product to the cart → Product appears in the cart |
| TC04 | Increase the quantity → Total price updates correctly |
| TC05 | Enter an invalid quantity → Invalid quantity is rejected |
| TC06 | Attempt to order an out-of-stock product → Order is prevented |
| TC07 | Submit checkout with missing details → Validation message appears |
| TC08 | Complete a simulated purchase → Order confirmation is displayed |
| TC09 | Update stock through the admin interface → Updated stock is reflected in the catalogue |
| TC10 | Open the application on mobile → Interface remains usable |

## Commands and boundaries

- npm run lint; npm run typecheck; npm run build: local static/build verification.
- npm run test:unit: Vitest domain logic and mocked provider behavior. This is not hosted Supabase verification.
- npm run test:integration: separately creates a disposable loopback PostgreSQL cluster, applies migrations and checks real SQL/transactions. No remote database should be configured for this command. Do not interpret this as hosted Auth verification.
- npx playwright test --config playwright.homepage-redesign.config.ts: demo storefront tests against a local production server, with Chrome installed.
- Hosted Auth suites are opt-in and require separate private setup; never supply real customer information.

Raw logs, traces, auth storage, operational screenshots and machine-specific evidence are excluded from publication. The demo does not enable the real admin workflow, so its TC09 result cannot be inferred from demo browser tests.
