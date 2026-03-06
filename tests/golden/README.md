# Golden Image Tests

This folder contains the visual regression setup for demo/tool pages.

## What Each Item Is

- `targets.json`
  Curated list of pages/viewports captured by visual tests.
- `scripts/capture.mjs`
  Starts a local static server and captures screenshots for all targets.
- `scripts/compare.mjs`
  Compares two screenshot sets by PNG bytes and writes a summary.
- `scripts/between-commits.mjs`
  Creates temporary git worktrees for two commits, captures both, then compares.
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
npm run test:golden:capture
npm run test:golden:compare
npm run test:golden:approve
npm run test:golden:between -- --base <base_sha> --head <head_sha>
```

Typical local flow:
1. `npm run test:golden:capture`
2. `npm run test:golden:compare`
3. Review `tests/golden/diff/summary.md` and changed image pairs.
4. If changes are intentional, run `npm run test:golden:approve`.

## CI

GitHub Actions workflow: `.github/workflows/golden-images.yml`.
It uploads `tests/golden/diff` as the artifact.
