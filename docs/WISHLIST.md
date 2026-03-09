# Wishlist

## P0 — Must-Finish Reliability
1. **Golden-image tests**
   - Why still needed: harness exists, but baseline coverage is not yet enforced in CI and not all key demos/tools are locked.
   - Needed to close: define stable baseline set, run compare in CI, and gate regressions on changed targets.

2. **Full GPOS positioning across scripts**
   - Why still needed: major mark/base/mark/ligature paths are in, but script coverage confidence is still test-driven rather than sign-off complete.
   - Needed to close: expand real-font fixture matrix and add explicit expected outputs for complex mark+ligature combinations per script family.

3. **Structured diagnostics expansion**
   - Why still needed: diagnostics exist, but not every fallback/unsupported path is standardized and surfaced consistently.
   - Needed to close: complete codepath audit and map remaining console-only branches to typed diagnostics.

## P1 — Parsing / Runtime Completeness
1. **WOFF2 support (runtime packaging)**
   - Why still needed: parser + decoder hook exist, but decoder strategy is still external/injected.
   - Needed to close: publish a default decoder packaging approach (or official integration guide) and validate with real WOFF2 fixtures end-to-end.

## P2 — Hinting and Outline Quality
## P3 — Tooling and DX
1. **Tools shared-lib cleanup**
   - Why still needed: tool pages still duplicate parsing, UI wiring, and render helpers.
   - Needed to close: extract common modules and migrate highest-duplication tools first.
2. **Known limitations matrix**
   - Why still needed: constraints are currently spread across code/comments/tool notes.
   - Needed to close: add one section in this file listing current limitations by area (format/shaping/layout/hinting/rendering) with closure criteria.

## Maintenance
1. **Node version policy**
   - Why still needed: no `.nvmrc` and no `engines` field in `package.json`.
   - Needed to close: add both, pin LTS policy, and verify local/CI parity.
