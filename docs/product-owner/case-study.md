# Product Owner case study

## Outcome and problem

Sacred Commerce is a demonstrable commerce model for an AI-enabled delivery interview. The product objective is confident discovery and clear purchasing expectations within a seven-day prototype, with scope decisions that can be defended technically. It is independent of Isha Foundation and Isha Life.

## Customers and journeys

| Persona | Need | Journey and recovery |
|---|---|---|
| Considered browser | Find an everyday object without understanding the full catalogue | Home → category/search → product facts → cart; recover from no matches with clear filters |
| Seasonal shopper | Discover relevant offerings within a budget | Navratri → filter/sort → visible price and availability → simulation |
| Mobile shopper | Read product information and edit quantities confidently | Compact navigation → detail → guest cart → validated checkout; clear invalid quantity and decline recovery |
| Demo reviewer | Understand functionality and limitations | Disclosure → complete guest journey → code/tests; distinguish local simulation from hosted persistence |

## Priorities and decisions

Must-haves are trustworthy product information, search and filters, quantity validation, stock awareness, clear totals, recovery feedback, responsive accessibility and honest demo boundaries. Real payment processing, production data, external branding, unverified claims and a speculative AI assistant are excluded. The database-backed implementation preserves authorization, transaction and idempotency requirements even though its hosted path is disabled in this preview.

The initial storefront establishes functional navigation, catalogue, original product images, guest cart and simulated checkout. Merchandising emphasizes actual fixture records rather than invented stock, provenance or benefits. Every product has an explicit demo identity.

## Measurable business hypotheses

| Hypothesis | Measurement plan | Guardrail |
|---|---|---|
| Intent-led categories help discovery | Eligible homepage sessions with category/search interaction | Task completion and no-result rate |
| Better product facts improve consideration | Detail opens and successful cart additions per exposed session | Price/stock comprehension |
| A seasonal entry makes the collection easier to find | Unique collection opens per exposed session | Mobile usability and navigation clarity |
| Clear checkout reduces confusion | Validation recovery and simulation completion rates | Users correctly identify that no real purchase occurred |

No analytics service is installed and no conversion uplift is claimed. Define exposure, consent, deduplication and measurement windows before collecting a baseline. Never collect recipient/address values in analytics.

## Roadmap and scope control

The seven-day MVP prioritizes core shopping, safe transaction design, premium responsive UI, original acceptance tests and reproducible evidence. Optional AI is cut before security, functional tests or clarity. Decorative animation and catalogue breadth can be reduced before the core experience.

A twelve-month vision would validate customer research and accessibility, complete independent hosted security/reliability review, introduce observable fulfillment and support operations, and evaluate grounded product assistance using verified database attributes and deterministic search fallback. Payment and production operations require separate approvals and compliance review.

## AI-assisted delivery evidence

AI supported requirements, task decomposition, implementation, SVG asset creation and tests. Human review set priorities, rejected unlicensed reference images, approved original artwork and required honest PASS/FAIL evidence. Test failures and screenshots informed targeted corrections. AI output was treated as a proposal until checked, not a source of customer research or achieved business outcomes.

## Editorial Gallery and Stillness Edit

The approved redesign introduces a signature typographic hero, intent directory, staggered five-product gallery and a distinct seasonal feature. Prices, stock labels, product details and cart actions remain visible. Mobile uses an intentional single-column sequence rather than a scaled desktop composition.

The Stillness Edit follows Curated Offerings and precedes Navratri. Its heading, reflective copy and two links provide a pause without adding duplicate product cards. The primary action leads to Ritual Essentials and the secondary to the project philosophy. Original SVG mountain/crescent and abstract still-life studies replace unlicensed reference images. They are identified as imagined illustrations, with no geographic, spiritual-benefit or product-provenance claim.

A tall mobile page is a deliberate trade-off for readable artwork and controls. Tests cover responsive widths, keyboard access, axe checks, image decoding, reduced motion and preserved commerce behavior. A screenshot evidence defect was traced to mixing viewport and document coordinates; corrected document-relative captures showed no layout defect and did not require a redesign.

Potential success measures include editorial CTA engagement, downstream category/detail/cart engagement and comprehension of the fictional demo boundary. These are proposed measures, not measured uplift or deployed analytics.

## Twilight experience and shopping feedback

The local upgrade addresses three customer frictions: uncertainty after adding an item, repeated travel to the cart, and reading comfort across lighting conditions. It preserves the approved editorial hierarchy and fictional catalogue rather than introducing another homepage redesign.

| Decision | Rationale and trade-off |
|---|---|
| 240ms CSS route entrance, 8px lift | Provides orientation without delaying navigation or replaying on cart edits. Reduced-motion preference removes decorative motion. |
| Two-second Added feedback | Confirms a successful action while retaining focus and the existing accurate live announcement. Repeated additions use the latest cart snapshot; the timer never mutates quantities. |
| Shared floating guest cart | Shows the existing store's summed quantity, including cross-tab edits. Nearby safe positions avoid actionable controls; it hides when no position is clear, while the drawer is open, and on cart/checkout. The header cart remains available. |
| Explicit Light/Twilight preference | Light remains the default. A validated local preference is applied before hydration; blocked storage falls back to the current page session. No analytics or account information is collected. |
| Reserved Stillness gradient bands | Softens the editorial-to-midnight-to-forest transition without drawing over copy, links or original illustrations. Extra vertical space is a deliberate trade-off for readability. |

Twilight changes interface tokens rather than inverting product images. Focus, forms, selection, loading and feedback use the same scoped palette. The non-demo database-backed interface remains outside the appearance scope; no authentication, schema, checkout backend or inventory architecture changes are included.

Proposed evaluation: compare add-confirmation comprehension and accidental repeat additions, time to reach/edit the cart, appearance preference retention, and mobile task completion. Establish a consented baseline before claiming improvement. No uplift has been measured and no analytics service was added. Address and payment-like form values must never enter measurement events.

Verification combines existing editorial/Stillness/shopping regressions with focused preference, storage failure, rapid-add, badge, navigation, reduced-motion, responsive and axe checks. Screenshot evidence and exact executed results are recorded in the local upgrade handoff; browser automation does not replace assistive-technology or physical-device testing.
