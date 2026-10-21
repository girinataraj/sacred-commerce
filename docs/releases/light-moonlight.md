# Light/Moonlight release candidate

Prepared locally for owner publication approval. No push, PR creation, merge or deployment has occurred. Candidate branch: `codex/release-light-moonlight`; target: `main`. The commit containing this record identifies the documentation-complete candidate.

## Exact source and ancestry

Public main: `c4598d667c6b4537963ae3459bcd3ef542644073`. Accepted application/test source: `e462432d3aca2157be44197e92f4d8544eb1069d`. All five intervening commits are retained, in order:

1. `0cb2e6a4d12de8e3f949a955e2ddb824ef5405e1` — appearance preference, route entrances, Added feedback and floating cart.
2. `916a2991724eccd64f54c814b3a33b05756a3661` — reviewed Light Stillness gradient refinement and clean gate.
3. `8e3dc1c6683029fa33f014a9c25312c6c888c6ce` — approved ivory/forest Light and indigo/silver Moonlight identities.
4. `b38e98d30cd128338836f73302e42ade6fc2891d` — mobile gutters, sale-card wrapping and price/control clearance.
5. `e462432d3aca2157be44197e92f4d8544eb1069d` — product-image clearance and Windows/tablet verification.

This is the existing sanitized publication lineage, not the original private development history. The release record/README/quality update is documentation-only; application code, tests, configuration, lockfile and all 30 public assets remain Git-content-identical to the accepted source. Earlier review documents are historical checkpoints; this record and the Windows/tablet handoff describe the final cumulative state.

## Customer-visible scope

Light remains the default ivory/forest identity; Moonlight uses midnight indigo and silver across the demo. A validated local preference retains the existing `twilight` storage value. Product colours and original artwork remain unchanged. Restrained route entrances respect reduced motion; successful adds show temporary feedback without changing authoritative local-cart quantity logic. The floating cart follows the existing count, avoids product imagery/prices/controls, retains keyboard stability and falls back to the header cart when no clear position exists. Stillness uses the existing pseudo-element architecture with theme-specific transitions into Navratri. Mobile corrections and loaded-font Windows/tablet geometry checks preserve the editorial layout.

## Evidence and limitations

The accepted final source gate executed lint, typecheck and supported Webpack production build (all exit 0), **166 unit + 198 browser = 364 PASS**, **0 FAIL / 0 skipped / 0 flaky**. See [quality scope](../quality.md) and [Windows/tablet review](../product-owner/windows-tablet-review.md). Release preparation verifies accepted source identity and saved executed results; it does not re-label those results as a fresh release-checkout test run. Raw QA artifacts and machine-specific paths are excluded from publication.

Both themes cover all six requested Windows desktop sizes and seven tablet sizes; native Chrome zoom covers 100–200%. Mobile, keyboard, reduced-motion, preference, cart, simulation and representative axe regressions remain included. Installed Windows Chrome was automated headlessly; touch was emulated. Physical tablets, other browser engines and screen readers are not certified. Simultaneous browser-cart writes and hosted backend integration remain known limitations. No real authentication/payment or durable hosted orders are enabled in demo mode. Five known HIGH development-tooling advisories remain; no dependency upgrade is included.

## Publication safety and exclusions

The public tree and every reachable public-history blob/commit metadata are reviewed for secrets, private paths, infrastructure/support identifiers and excluded artifacts. Only reviewed source, tests, original assets, manifests and sanitized product documentation are eligible. Private environments, operational handoffs, original private history, raw QA/screenshots/logs, auth storage, generated clients/builds, dependencies and Vercel linkage remain excluded. Commits use the owner's verified GitHub noreply identity.

Read-only integration checks found zero active GitHub webhooks, zero Actions workflows, no Git link on the existing Vercel project and no matching link across all six accessible projects. No integration/settings were modified. Recheck these conditions immediately before any later push; they can change independently of this source. Keep `SACRED_DEMO_MODE=true` for any separately approved build and runtime.

## Rollback and next gate

Publication alone does not alter production. Before publication the candidate can simply remain local; public main is unchanged. If a later merge needs reversal, revert the approved PR/merge with a new reviewed commit rather than resetting or force-pushing. The previous source baseline remains reachable at `c4598d667c6b4537963ae3459bcd3ef542644073`. Any later Vercel release must separately record the then-current deployment, stage and verify the exact candidate, and retain/promote the previous verified deployment for rollback without rebuilding. No deployment ID is assumed current from historical records.

Next: owner approval to push this exact candidate branch and open the prepared PR. Merge and production deployment remain separate gates. No Supabase or original-development-repository changes are included.
