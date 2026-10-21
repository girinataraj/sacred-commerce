# Approved Light / Moonlight implementation — local handoff

Status: ready for owner approval; no publication or deployment. Branch: `codex/twilight-experience`. Reviewed starting commit: `916a2991724eccd64f54c814b3a33b05756a3661`. The scoped commit containing this handoff identifies the final reviewed source.

## Delivered design

- Light retains ivory, warm heritage accents and forest controls. Stillness now uses forest green, entered through controlled ivory/sage/green stops. Navratri, the disclosure and footer remain forest green. No indigo interface surfaces are introduced.
- Dark is visibly named **Moonlight**. Midnight/deeper indigo surfaces, silver actions/highlights, ivory text and indigo Navratri/footer replace green and gold UI surfaces. Success feedback is blue-toned; error feedback remains distinct and readable.
- Both Stillness pseudo-elements, reserved band heights, content spacing, two original illustrations and CTA targets remain intact. The lower transition follows the selected seasonal token. No new animation, decorative band or layout redesign was added.
- Shared tokens cover header, navigation/drawer, floating cart, product cards, collection hero, purchase panels, forms, disabled/hover/focus states, feedback, loading and information pages. Original assets are not filtered, inverted or recoloured.
- Existing Add feedback, rapid-add quantities/stock limits, cart persistence, Back navigation, page motion, reduced motion and simulated outcomes remain unchanged. The stable validated `twilight` preference value selects Moonlight so saved preferences survive this identity update. Light remains the default.

The approved reference https://designs.magicpath.ai/v1/sweetly-cliff-5548 was inspected visually in Light and Dark. It informed art direction only. No prototype source, placeholder catalogue, asset, mock cart or new dependency was imported.

## Fresh executed gate

All commands ran sequentially after the final application-source changes, against the local production build with `SACRED_DEMO_MODE=true`. There were no subsequent application-source changes.

| Actual command | Result |
|---|---|
| `npm run lint` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `npm run build` | PASS, exit 0; existing supported Webpack build |
| `npm run test:unit` | 166 PASS / 0 FAIL / 0 skipped; 16 files; exit 0 |
| `npx playwright test --config .local/moonlight/regression.config.ts` | **138 PASS / 0 FAIL / 0 skipped / 0 flaky**, one complete run, exit 0 |
| Total | **304 PASS / 0 FAIL / 0 skipped** |
| Public asset comparison | 30 files compared with starting commit; zero byte mismatches |
| Scoped review | No actionable findings; read-only source review, not a substitute for executed tests |
| Git whitespace / private-pattern review | PASS |

The ignored regression wrapper imports the existing complete relevant configuration and changes only explicit directory resolution and evidence locations. It executes the existing 106 regressions plus 32 new theme cases. Saved evidence is `.local/moonlight/gate-results.json`, `final-lint.log`, `final-typecheck.log`, `final-build.log`, `final-unit.log`, `final-browser.log` and `regression-results.json`. Accepted historical Twilight/refinement evidence was preserved.

Both appearances passed palette/responsive/axe checks at **320, 390, 768, 1440 and 1920px**, alongside the existing width matrix. Computed UI backgrounds and pseudo gradients were checked for unwanted indigo in Light and unwanted green in Moonlight across home, catalogue, seasonal collection, category, detail, cart, checkout, about, demo guide, privacy and guest-account routes. Image pixels are deliberately excluded from colour rejection; naturally green products and original indigo landscape artwork remain original. Image CSS filters remain `none`. Drawer palette/axe and keyboard focus restoration are checked in both themes; product hover/success and declined-checkout feedback are covered.

Earlier focused evidence remains honest: the initial new palette suite recorded 29 PASS / 1 FAIL, identifying a 4.4:1 Light caption at 768px. Darkening its muted-text token corrected that finding. Expanded route axe checks then exposed a Moonlight collection hero inheriting an ivory panel; its surface now uses the selected indigo token. Both fixes passed the complete final run. Failed attempts are retained in focused logs and are not relabelled as passed.

## Visual evidence

Forty screenshots were captured and visually inspected through contact sheets and detailed viewport/page views. Evidence lives in `.local/moonlight/screenshots/`, for each `light` / `moonlight` and `1440` / `390` combination:

- `entry.png`: actual initial viewport.
- `full.png`: full homepage, including footer.
- `context.png`: document-relative crop covering the end of Curated Offerings, complete Stillness and the start of Navratri.
- `stillness-transition.png` and `navratri-transition.png`: actual viewport passage captures.
- `added.png`: actual viewport with successful Add feedback and live floating count.
- `collection.png`, `product.png`, `cart.png`, `checkout.png`: rendered full-page shopping screens.

For example: `moonlight-1440-full.png`, `moonlight-390-context.png` and `light-390-stillness-transition.png`. The original product/editorial images keep their natural colours. No screenshot inspection required another source change.

## Changed files and boundaries

Application: `src/features/demo/experience.css`, `homepage.module.css`, `stillness.module.css`, `appearance.tsx` and the compatibility comment in `appearance-model.ts`.

Tests: `tests/twilight/experience.spec.ts` updates the visible appearance name without changing existing interaction assertions; `tests/twilight/palette.spec.ts` adds the 32 cases above.

Documentation: `docs/product-owner/case-study.md` and this handoff. No package, lockfile, original asset, schema, service, API, real Auth/payment or database configuration changes.

The original development repository, its existing work and public main are preserved. No push, merge, deployment, Supabase operation or paid dependency was performed. This is local Chrome verification; physical devices, assistive-technology certification and hosted backend acceptance remain outside the claim. Existing dependency/hosted-runtime risks remain unchanged.

Recommendation: technically ready for owner visual approval and a separately authorized staged **demo** release. No measured business uplift is claimed, and publication/deployment remain gated on explicit owner authorization.
