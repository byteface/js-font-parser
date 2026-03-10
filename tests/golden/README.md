# Golden Image Tests

This folder contains the visual regression setup for demo/tool pages.
It is intended to act as a visual regression gate.

## What Each Item Is

- `targets.json`
  Curated list of pages/viewports captured by visual tests.
- `scripts/capture.mjs`
  Starts a local static server and captures screenshots for all targets.
- `scripts/compare.mjs`
  Compares two screenshot sets by PNG bytes and writes a summary.
- `scripts/between-commits.mjs`
  Creates temporary git worktrees for two commits, captures both, then compares.
- `scripts/validate-targets.mjs`
  Validates that `targets.json` is well-formed and every target path exists.
- `scripts/approve-baseline.mjs`
  Replaces committed baseline images with the current capture after review.
- `baseline/`
  Optional committed reference screenshots (golden images).
- `current/`
  Local capture output for the current working state.
- `diff/`
  Comparison output (`summary.md`, `summary.json`, and changed image pairs).

## Commands

From repo root:

```bash
npm run test:golden:validate
npm run test:golden:capture
npm run test:golden:compare
npm run test:golden:approve
npm run test:golden:between -- --base <base_sha> --head <head_sha>
```

Typical local flow:
1. `npm run test:golden:validate`
2. `npm run test:golden:capture`
3. `npm run test:golden:compare`
4. Review `tests/golden/diff/summary.md` and changed image pairs.
5. If changes are intentional, run `npm run test:golden:approve`.

Compare two commits directly:

```bash
npm run test:golden:between -- --base <base_sha> --head <head_sha> --targets tests/golden/targets.json
```

## Required Locked Targets

Required capture pages are defined in `tests/golden/targets.json`:
- `demos-index` (`/demos/index.html`)
- `tools-index` (`/tools/index.html`)
- `tools-metadata` (`/tools/metadata.html`)
- `tools-layout-engine` (`/tools/layout-engine.html`)
- `tools-variable-font` (`/tools/variable-font.html`)
- `tools-unicode-coverage` (`/tools/unicode-coverage.html`)
- `tools-all-glyphs` (`/tools/all-glyphs.html`)

CI validates this list before capture.

## CI

GitHub Actions workflow: `.github/workflows/golden-images.yml`.
It:
- validates `targets.json`,
- runs compare only when visual-risk paths change,
- uploads `tests/golden/diff` as an artifact when compare runs.

To make this a required gate:
1. Open `Settings -> Branches -> Branch protection rules`.
2. Edit your protected branch rule.
3. Add required status check `Golden Images / visual-regression`.
