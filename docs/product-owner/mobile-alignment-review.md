# Mobile alignment correction — local owner review

Status: ready for owner approval; no publishing or deployment. Branch: `codex/twilight-experience`. Reviewed baseline: `8e3dc1c6683029fa33f014a9c25312c6c888c6ce`. The scoped commit containing this record identifies the final source. Historical theme screenshots and QA remain preserved.

## Confirmed defects and exact corrections

| Confirmed observation | Scoped correction |
|---|---|
| Phone header/footer edges were 16px while editorial content used 24px; at 768px they were 24px versus 40px | `experience.css` defines a shared demo-only phone gutter: 20px through 360px, 24px through 767px; containers use it. At 768–1023px containers use the existing 40px editorial gutter. |
| At 320px the sale price block extended to x=321.4px, beyond the viewport/card; the page's existing overflow clipping hid reference/discount text | `homepage.module.css` allows sale-title/price wrapping through 599px, with a flexible title and a bounded left-aligned price group. Existing typography is unchanged. The 600–767px column layout retains its natural title height. |
| Floating cart avoided actionable elements but could cover a neighbouring product price | `floating-cart.tsx` includes existing `.price-block` and `.availability` elements in its collision checks, preserving the current safe positions, focus guard, route/drawer hiding and fallback. |
| Narrow gutter adjustment must preserve original full-bleed mountain artwork | `stillness.module.css` uses the shared gutter for section padding and its matching negative image margin. Original artwork and pseudo gradients remain unchanged. |

The suspected category-heading overrun was not reproduced with loaded fonts: its rendered text remained within the grid, so no category typography or layout change was made. No general font shrinking, image replacement, forced image symmetry, theme changes, catalogue changes or simulation rewrite occurred.

Measured shared edges after correction: 20px at 320/360, 24px at 375/390/430/640, and 40px at 768. Title/price/action bounding rectangles show no collisions or clipped price groups. Decorative image offsets and intentionally centred headings are not forced onto a uniform left edge.

## Executed final quality gate

All final commands ran sequentially after the last application-source correction with `SACRED_DEMO_MODE=true`, against local production mode. No application source changed afterwards.

| Actual command | Actual result |
|---|---|
| `npm run lint` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `npm run build` | PASS, exit 0; supported Webpack production build |
| `npm run test:unit` | **166 PASS / 0 FAIL / 0 skipped**, 16 files, exit 0 |
| `npx playwright test --config .local/mobile-alignment/regression.config.ts` | **156 PASS / 0 FAIL / 0 skipped / 0 flaky**, one complete run, exit 0 |
| Final formal test total | **322 PASS / 0 FAIL / 0 skipped** |
| `git diff --check` | PASS |

The ignored regression wrapper imports the existing complete relevant configuration and changes only explicit directory resolution/evidence paths. All previous 138 browser cases remain unchanged. Eighteen new cases cover both themes at 320, 360, 375, 390, 430, 640 and 768px, plus four real 200% Chrome zoom cases. Assertions measure shared content edges, price/title bounds, usable action targets, expected gallery ratios, unchanged action-row dimensions during Added feedback, live counts, critical-control/price collision avoidance, menu focus loop/Escape and reachable theme focus. Existing axe, theme leakage, storage, stock, checkout simulation, responsive and security-boundary regressions passed in the complete run.

Actual 200% zoom uses Chrome's native Page zoom setting in isolated ignored test profiles, not CSS zoom, pinch zoom or device-scale-only emulation. Observed CSS widths halve and devicePixelRatio doubles: 640→320 and 780→390. Four supplemental journeys independently verify View Details keyboard navigation, adding a second item, quantity 2 / total ₹398, Back, theme persistence, menu focus wrapping and Escape restoration. These supplementary journeys are reported separately and are not added to the formal 322-test total.

Honest intermediate record: two new 320px RED cases reproduced the baseline gutter/price defects; the first focused correction run passed 16 cases. Scoped review then identified the new flex basis would become excess height in the existing 600–767px column layout. The first final gate was stopped during build, the rule was restricted to row layouts and a 640px height-guard case was added in both themes. The fresh final gate above includes that correction; no interrupted or failed attempt is labelled PASS.

## Native screenshot evidence

Normal screenshots are **native width × 900px**, device scale 1, captured from actual viewports with loaded fonts/images. They are not downscaled full-page screenshots. Captures exist for both Light and Moonlight at every requested width and the additional 640px breakpoint. Sections: first viewport/header, hero artwork, intentions, product grid, product actions, sale actions, Stillness copy/CTAs, both artworks, Navratri context, philosophy, footer, legal text and Added/floating-cart state.

Evidence root: `.local/mobile-alignment/`. `native-screenshot-index.md` links every final native capture, including the required **320, 390 and 430px** sets, desktop and real-zoom captures. The `before/` directory preserves accepted-source captures. Native 1:1 comparisons are `comparison-header-320.png`, `comparison-sale-price-320.png` and `comparison-floating-cart-320.png`. Final images are under `after/`; for example `light-320-ceramic-actions.png`, `moonlight-390-stillness.png` and `moonlight-430-legal.png`.

Visual inspection used individual native images and 1:1 viewport strips, with no resizing or full-page shrinking. Representative section captures were inspected across every width and both appearances, including the 640px sale card and 768px layout. No additional source correction was needed after the final capture. Both 1440×1000 desktop entry images are pixel-identical to the approved baseline.

Machine-readable evidence: `before-measurements.json`, `after-measurements.json`, `gate-results.json`, `results.json` and `zoom-and-desktop.json`; exact logs are `final-lint.log`, `final-typecheck.log`, `final-build.log`, `final-unit.log`, `final-browser.log` and `extra-zoom.log`. Failed/interrupted evidence remains separate. Raw screenshots, profiles and logs are ignored and excluded from the commit.

## Scope and verdict

Changed application files: `src/features/demo/experience.css`, `homepage.module.css`, `stillness.module.css` and `floating-cart.tsx`. Added `tests/twilight/mobile-alignment.spec.ts` and this handoff only. Previous test cases, package/lockfile, public assets, backend, Auth, database and checkout implementation remain unchanged. The original repository, its 28 commits and existing work, and public main are preserved.

**Mobile:** ready for owner approval; measured alignment, action/price integrity and native visual inspection pass in both themes. **Desktop:** preserved; regression passes and both entry screenshots are pixel-identical. Physical-device and assistive-technology certification remain outside this local Chrome gate. Existing browser-cart simultaneous-write and hosted-backend limitations remain unchanged. No GitHub push, merge, Vercel deployment, Supabase/database operation, real payment/Auth or paid dependency was performed. Stop before publishing/deploying.
