# Twilight experience — local review handoff

Status: ready for owner visual review; not published or deployed. Feature branch: `codex/twilight-experience`. Base: `c4598d667c6b4537963ae3459bcd3ef542644073`. The scoped feature commit containing this document identifies the reviewed source. Public main is unchanged.

## Delivered behavior

- Demo route entrance: CSS-only 240ms opacity/8px lift. Path changes remount the entrance; cart updates do not. Back navigation remains native App Router navigation. Reduced motion removes decorative animation.
- Shared add control: visible Added checkmark for two seconds after success; repeat clicks restart feedback without duplicating live announcements. Accessible names remain stable and match the normal visible labels. The timer cleans up on unmount. Adds read the latest existing store snapshot, so synchronous rapid clicks do not lose quantities or exceed fixture stock.
- Floating cart: existing summed quantity and storage events; 58px desktop/56px mobile target with safe-area offsets. It selects nearby clear vertical positions, or hides if all positions intersect actionable controls. Image-bearing anchors are excluded from collision checks to avoid treating their large artwork area as an obstructed control. The header cart remains available. The shortcut hides with the drawer and on cart/checkout, and does not move while focused.
- Appearance: explicit Light default and optional Twilight Blue, persisted under a dedicated validated preference key. A static demo-only head script applies the preference before hydration; only the expected root attribute is suppressed. Storage failure preserves usable page-session controls. Interface tokens change; image pixels do not. Header, drawer, catalogue, product, purchase, information, footer and feedback share the appearance.
- Stillness: pointer-inert pseudo-element gradient bands occupy reserved space above and below the original content. Their endpoints match the editorial canvas, midnight section and seasonal forest. Original illustrations, copy and CTA targets are preserved.

No dependencies, original assets, backend services, migrations, Auth settings, payment operations or private configuration were changed. The integrated non-demo interface is outside the appearance scope. Demo purchases remain browser-local simulations.

## Executed verification

All commands ran against the local production demo build. No hosted database or deployed acceptance checks were run for this upgrade.

| Command / gate | Actual result |
|---|---|
| `npm ci --no-audit` | PASS; lockfile unchanged |
| `npm run lint` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `SACRED_DEMO_MODE=true npm run build` | PASS, exit 0; existing Webpack build |
| `npm run test:unit` | 166 PASS, 0 FAIL, 0 skipped, 16 files; exit 0 |
| `npx playwright test --config playwright.twilight-regression.config.ts` | 105 PASS, 1 FAIL, 0 skipped; exit 1. All 75 existing regressions passed. One new assertion loaded the old visible-label expectation while that test was being corrected. |
| `npx playwright test --config playwright.twilight.config.ts --grep "navigation clears transient"` | Corrected affected case: 1 PASS, 0 FAIL, 0 skipped; exit 0, same final application build |
| Final distinct browser cases | 106 verified PASS: 75 existing + 31 upgrade. No unresolved failures or skipped cases. This is combined full-run and affected-case evidence, not a claim of a single all-green run. |
| Final distinct unit + browser cases | 272 PASS, 0 unresolved FAIL, 0 skipped |
| Scoped source review | One label-in-name issue corrected by matching normal visible text to the stable accessible label; no remaining confirmed finding |
| Git whitespace / scope checks | PASS; no backend, dependency, fixture or asset changes |

Earlier focused evidence is retained: expected missing-feature RED checks; initial focused browser run 19 PASS / 9 FAIL, followed by 9 affected PASS after safe-position/focus-test corrections. A final unit attempt was blocked by sandbox EPERM during temporary-file renames (16 suites, zero tests executed); the same local command outside that restriction passed all 166 tests. None of these failed attempts is reported as passed.

Raw ignored evidence: `.local/twilight/build-final.log`, `lint-final.log`, `typecheck-final.log`, `unit-final-networkless.log`, `regression-final.log`, `final-results.json`, `label-correction-verification.log`, `results.json`, `contrast.json`, `visual-findings.json` and `preservation-and-scope.json`. Historical evidence was not overwritten.

## Accessibility, integrity and visual inspection

Both appearances were tested at 320, 360, 390, 768, 1024, 1440 and 1920px, with additional 2560px visual inspection. No horizontal overflow was observed. Axe checks passed at representative narrow/wide widths and on Twilight catalogue, detail, cart, checkout, decline and success states. Keyboard focus, drawer Escape restoration, floating-control collision recovery, reduced motion, blocked storage, persisted preference, hydration errors, cross-tab cart changes, rapid additions, limits, clear/remove, exact totals and both simulated outcomes were exercised.

Computed Twilight contrast ratios: body/canvas 14.80:1, muted/canvas 11.40:1, form/surface 12.15:1, primary-button text 10.08:1, boundary/surface 3.25:1, error text 9.47:1 and success text 10.52:1. These token measurements supplement actual-page axe checks; they are not certification of every possible rendered state.

Screenshots in `.local/twilight/screenshots/` were inspected visually. For each Light/Twilight × 1440/390 combination, `entry`, `full`, `context`, `stillness` and `added` images are available. Twilight includes `product`, `cart`, `checkout` at both widths plus the 390px drawer. Context crops use document-relative bounds from full-page captures, showing the end of Curated Offerings, the complete Stillness content and the beginning of Navratri. Desktop purchase screenshots wait for the existing store to hydrate so count evidence is consistent. No layout redesign was required after inspection.

The original repository's 1,251 preservation-snapshot files are byte-identical, all 28 commits and its original dirty status are unchanged. The sanitized publication checkout remains clean at the approved base. A scoped private-pattern scan found zero matches in proposed source/docs/tests; no raw QA evidence or private operational handoffs are included.

## Remaining limits and next gate

Owner visual acceptance is the next gate. No merge, push or deployment has occurred. Physical devices, screen-reader/speech-control testing and hosted backend integration are not certified by this local Chrome run. Simultaneous independent multi-tab read-modify-write operations retain the existing browser-cart last-write limitation; cross-tab sequential updates are synchronized. Collision positioning favors access to underlying controls and may temporarily hide the floating shortcut; the header cart remains available. Existing dependency/security findings were neither changed nor remediated in this scoped UI task.

The case study records customer rationale, explicit trade-offs and proposed measurable hypotheses. No conversion or customer-satisfaction uplift is claimed.
