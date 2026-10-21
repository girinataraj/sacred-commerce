# Windows desktop and tablet alignment — local owner review

Status: ready for owner approval; all local final gates passed. Branch: `codex/twilight-experience`. Reviewed baseline: `b38e98d30cd128338836f73302e42ade6fc2891d`. The scoped commit containing this record identifies the final source. No push, merge or deployment is authorized.

## Findings and exact change

Actual installed Google Chrome **156.0.8078.47** ran on Windows (`win32`), in headless mode against the local production build. Desktop CSS viewports: 1280×720, 1366×768, 1440×900, 1536×864, 1920×1080 and 2560×1440. Tablet CSS viewports: 768×1024, 820×1180, 834×1194, 1024×1366, 1024×768, 1180×820 and 1280×800. Every size was checked in Light and Moonlight.

Loaded-font DOM rectangles and text ranges found no viewport overflow, title/price collisions, clipped actions, unusually narrow product cards, header crowding or unexpected navigation wrapping across these 26 combinations. The hero remains centered with the approved 1440px section cap, including 560px outer margins at 2560px; this intentional reading width and editorial image offsets were retained. Tablet portrait and landscape preserve usable navigation, category/grid transitions, Stillness copy/artwork, seasonal content and footer columns. Native viewport screenshots were visually inspected across representative sections and sizes in both themes.

One independently reproduced defect: the floating cart could cover the comb photograph at specific scroll positions, including 768×1024 portrait and 1024×768 landscape. `src/features/demo/floating-cart.tsx` now treats existing product-image boxes as obstacles and derives the nearest clear vertical gap from obstacle edges, retaining an 8px separation and at least 16px top clearance. The existing right/bottom safe-area CSS, focus stability guard, route/drawer hiding, count feedback and no-clear-gap fallback remain intact. It does not resize, recolor or move product content. Header/headline collision probes on catalogue and seasonal routes at 768, 1024 and 1280px found no new obstruction at the sampled positions.

No CSS, typography, gradient, theme token, imagery, catalogue, checkout, Auth, database, dependency or payment implementation changed.

## Verification

One fresh complete final gate ran after the final application change, with these executed results:

| Command | Actual result |
|---|---|
| `npm run lint` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `npm run build` | PASS, exit 0; supported Webpack production build |
| `npm run test:unit` | **166 PASS / 0 FAIL / 0 skipped**, 16 files, exit 0 |
| `npx playwright test --config .local/windows-tablet/regression.config.ts` | **198 PASS / 0 FAIL / 0 skipped / 0 flaky**, one complete 3.9-minute run, exit 0 |
| Final formal total | **364 PASS / 0 FAIL / 0 skipped** |
| Final 26-combination geometry matrix | 0 clipping/collision findings; 0 horizontal overflow |

New representative axe cases passed in both themes at all four specified sample sizes; the existing axe and accessibility regressions passed too. No application source or test assertions changed after this final run. All commands use the existing scripts with `SACRED_DEMO_MODE=true`; the ignored Playwright wrapper imports the complete relevant regression configuration, changing only explicit evidence/directory resolution. Existing tests remain unchanged; 42 new cases cover 26 normal viewport/theme journeys and 16 native Chrome zoom journeys.

The new normal cases exercise loaded-font geometry, coarse-pointer tablet emulation, tap-based Add/menu/theme interaction, Added feedback, live counts, focused menu recovery, quantity 2 / total ₹398, Back navigation and cart clearance at product/control/image positions. Representative axe checks use WCAG 2 A/AA, 2.1 AA and 2.2 AA tags in both themes at 768 portrait, 1024 landscape, 1440 and 2560px. Existing keyboard, reduced-motion, theme persistence, simulation, storage and mobile regressions remain part of the complete suite.

Native Chrome Page zoom settings are exercised at 100%, 125%, 150% and 200% in isolated ignored profiles at outer window sizes 1280×900 and 1920×1080, in both themes. These are actual browser zoom changes, not CSS scaling or pinch emulation; assertions verify CSS client width and devicePixelRatio ratios. Actual client metrics and screenshots are retained because browser chrome/window borders affect the available viewport:

| Outer window | 100% CSS viewport | 125% | 150% | 200% |
|---|---|---|---|---|
| 1280×900 | 1262×804 | 1010×643 | 841×536 | 631×402 |
| 1920×1080 | 1902×984 | 1522×787 | 1268×656 | 951×492 |

Both themes returned these same dimensions; devicePixelRatio was respectively 1, 1.25, 1.5 and 2. The initial browser-regression zoom PNGs caught an unsettled visual state; the default screenshot clip also cropped the physical viewport at zoom. They were rejected as visual evidence. Sixteen separate entry-view zoom captures in `zoom-settled/` wait for fonts, images and transitions and explicitly scroll to the document top. Chrome’s native `Page.captureScreenshot` without a clip captures the complete physical client viewport (1262×804 or 1902×984), while CSS viewport dimensions follow the zoom table. Native 200% captures were visually inspected; the original failed visual evidence remains preserved. This screenshot-only correction did not change source or test results.

Honest intermediate record: an initial new test used a product absent from the homepage gallery and timed out; its selector was corrected. The next focused run returned 41 PASS / 1 FAIL due to fractional pixel rounding around the existing 44px action minimum at 150% zoom. Inspection confirmed CSS min-height 44px; the new geometry assertion now permits a 0.01px rounding tolerance without changing controls. After the image-obstruction fix and focused image assertion, all 42 focused cases passed. Those intermediate logs are preserved separately and are not substituted for the final complete run.

## Evidence and preservation

Evidence root: `.local/windows-tablet/`. `native-screenshot-index.md` links the original and final native viewport PNGs, including same-position image-clearance comparisons at 768×1024, 834×1194, 1024×768 and 1280×720. Each full matrix contains eight section captures per combination: entry/header/hero, intentions, gallery, sale-price information, Stillness copy, original artwork, Navratri and footer. Final matrix: 208 PNGs plus eight targeted image-clearance captures. All are native viewport captures at device scale 1 with loaded fonts/images; full-page shrinking is not used.

Machine-readable records: `before-measurements.json`, `after-measurements.json`, `additional-probes.json`, `focused-corrected-results.json`, `results.json`, `final-commands.json`, `zoom-metrics.json`, `zoom-settled/metrics.json` and `preservation.json`. Logs: `final-lint.log`, `final-typecheck.log`, `final-build.log`, `final-test-unit.log`, `final-browser.log`. Screenshots, logs and Chrome profiles remain ignored, outside public commits.

The original development repository's HEAD, all 28 commits, dirty status and 1,251 saved file hashes remain unchanged. Public main remains clean at its original checkpoint; all 30 public assets are byte-identical. One scoped review found no actionable defect in the cart change. Final tracked scope: the cart component, `tests/twilight/windows-tablet.spec.ts`, and this handoff.

## Limits and next gate

This verifies installed Windows Chrome with automated native browser zoom and emulated tablet touch, not physical-tablet hardware or a human-operated headed Chrome session. It does not certify other browser engines or assistive technology. Existing browser-cart simultaneous-write and hosted-backend limitations are unchanged. No Supabase, real authentication/payment, paid service, remote Git or deployment operation occurred. Stop for owner approval before publication or deployment.

**Readiness verdict:** the local Windows/tablet visual and functional release gate passes. Only the reproduced floating-cart image obstruction required an application change. Ready for owner review; publication/deployment still require approval.
