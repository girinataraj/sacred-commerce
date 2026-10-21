# Sacred Commerce

A premium Indian lifestyle commerce prototype and Product Owner — AI-Enabled Delivery case study. Built with Next.js 16, TypeScript, React, Tailwind CSS, Prisma, PostgreSQL/Supabase, Vitest and Playwright.

**Independent fictional interview demo. No affiliation with, endorsement by, or representation of Isha Foundation or Isha Life.** Product names, prices, stock and descriptions are synthetic. No copyrighted Isha logos or product photographs are included.

## What you can try

- Browse 20 original demo products across four categories and a 13-product Navratri 2026 collection.
- Search, filter and sort; inspect product details, INR pricing and availability.
- Add to a guest cart, change quantities and recover from invalid or stale local state.
- Complete validated, simulated success or decline checkout. No money moves, no stock is reserved and no shipment is created.
- Switch between Light (ivory/forest) and Moonlight (indigo/silver), with a remembered local preference and unchanged original product colours.
- See Added feedback, an accurate floating guest-cart count and restrained navigation transitions that respect reduced motion.
- Use responsive layouts, keyboard navigation, visible focus, local fonts and original illustrations.

Demo cart and simulated confirmations are browser-local. They are not durable server orders. Login, account and admin routes explain their disabled boundaries in this mode. Authentication and database mutations remain disabled until hosted integration is separately verified. The repository also contains the database-backed implementation and its tests; inclusion is not a claim of hosted readiness.

## Run locally

Use Node.js 24 and npm 11 (exact versions are recorded in .nvmrc/package.json).

```sh
npm ci
# Copy .env.example to .env.local using your shell or editor.
# Leave SACRED_DEMO_MODE=true. No credentials are needed.
npm run build
npm run start
```

Open http://127.0.0.1:3000. For development use `npm run dev`. Keep demo mode enabled during both build and runtime; never use privileged operator credentials as application runtime credentials. Do not run migration, seed or provisioning commands merely to start this demo.

## Verification

```sh
npm run lint
npm run typecheck
npm run test:unit
```

Browser test configurations and further distinctions are described in [quality and test scope](docs/quality.md). Some suites require a local Chrome installation; database suites create isolated test clusters and must be run separately from hosted environments. They are not required for the self-contained preview.

## Product ownership and architecture

- [Case study: customer problems, decisions, roadmap and measurable hypotheses](docs/product-owner/case-study.md)
- [Architecture, security boundaries and trade-offs](docs/architecture.md)
- [Quality scope and acceptance baseline](docs/quality.md)
- [Original artwork and font licenses](docs/assets.md)
- [Publication policy and history](docs/publication.md)

## AI-assisted delivery

AI assisted requirements decomposition, UI implementation, original illustration authoring, test construction, code review and evidence interpretation. The owner retained scope, rights and release decisions. Suggestions were checked against source, executed tests and visual evidence. Proposed conversion or discovery improvements are hypotheses, not achieved business results. A grounded AI shopping assistant is deferred; this demo does not invent product recommendations or call an AI service.

## Publication history and limitations

This is a **sanitized publication snapshot, not the complete development history**. Private development history is preserved separately. Public commits group the working storefront baseline and the subsequent editorial redesign for review; they do not imply the project was developed in two commits. Private environment files, operational handoffs, provider routing details, personal machine paths and raw test logs are intentionally excluded.

This repository is an interview portfolio artifact, not a production-ready store. There is no real payment gateway, production customer data, verified hosted authentication or automatic deployment integration. The existing public demo can lag this source; publication does not deploy or change it.

## Editorial design and Light/Moonlight release

The source includes the Editorial Gallery homepage, original Stillness artwork, theme-aware Stillness/Navratri transitions, persistent Light/Moonlight preference, Added feedback, page entrances and a floating cart that avoids product images, prices and controls. Mobile gutters and sale-card wrapping are corrected; desktop editorial asymmetry is preserved.

After a demo-mode build, run `npx playwright test --config playwright.twilight-regression.config.ts` for the complete relevant 198-case local demo browser regression (installed Chrome required). The accepted source gate executed 166 unit and 198 browser cases, with no failures or skips; this is local demo evidence, not hosted or deployed verification. See the [release candidate record](docs/releases/light-moonlight.md) for source ancestry, exact scope, limitations and rollback. Publication does not update production, and deployment requires separate approval.
