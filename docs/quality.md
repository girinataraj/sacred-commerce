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

## Executed publication-checkout gate — 21 October 2026

| Command | Result | Scope |
|---|---|---|
| npm ci --no-audit | PASS, exit 0 | Fresh pinned installation and generated client |
| SACRED_DEMO_MODE=true; npm run build | PASS, exit 0 | Local production Webpack build, no deployment |
| npm run lint | PASS, exit 0 | Final export source and configuration |
| npm run typecheck | PASS, exit 0 | Final export source and configuration |
| npm run test:unit | 161 PASS, 0 FAIL | Domain/unit and mocked provider behavior |
| npx --no-install playwright test --config playwright.stillness-edit.config.ts | 75 PASS, 0 FAIL, 0 skipped | Local demo storefront, homepage and Stillness regression |
| npm audit --omit=dev --json | 0 findings, exit 0 | Production dependencies only |

The browser set covers all 20 product pages, guest-cart/checkout recovery and persistence, disabled Auth/admin/backend boundaries, original images, responsive layouts, keyboard access and axe checks. It does not verify hosted persistence or provider authentication. No remote database, hosted Auth or deployed acceptance suite ran during this publication gate. The original TC01–TC10 baseline is retained above; no new deployed or database-backed acceptance status is claimed from these demo tests.

Five previously recorded HIGH development-tooling findings remain tracked in the lint dependency chain (eslint-config-next, @next/eslint-plugin-next, fast-glob, micromatch, braces). The production-only audit above does not clear development dependencies. No dependency upgrades or automatic audit fixes were performed.
