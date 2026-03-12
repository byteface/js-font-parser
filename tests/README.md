## Test Layout

The suite is grouped by concern rather than by discovery order.

- `font-parser-smoke.test.mjs`
  Core library smoke coverage.
- `fixture-smoke.test.mjs`
  Curated fixture and variation smoke coverage.
- `canvas-glyph-diagnostics.test.mjs`
  CanvasGlyph load and missing-canvas diagnostics.
- `text-spacing-controls.test.mjs`
  User-visible spacing and invisible-character behavior.
- `text-renderers.test.mjs`
  SVG and canvas renderer alignment with shaped layout.
- `text-kerning-behavior.test.mjs`
  Kerning, interpolation, and cross-font layout invariants.
- `renderer-canvas-*.test.mjs`
  Canvas renderer branch and safety coverage.
- `parser-api-*.test.mjs`
  Shared parser API finite-value and resilience coverage.
- `parser-cmap-layout-regressions.test.mjs`
  Parser, cmap, and low-level layout regressions that cross subsystem boundaries.
- `woff-*.test.mjs`
  WOFF decode, diagnostics, and layout edge cases.
- `cjk-coverage.test.mjs` / `cjk-scale-stress.test.mjs`
  CJK fixture coverage and large-font stress checks (cmap breadth, high-index glyph safety, long-run layout stability).
- `indic-script-confidence.test.mjs`
  Script-focused confidence checks for Tamil, Malayalam, Telugu, and Sinhala shaping/layout invariants.
- `sea-script-confidence.test.mjs`
  Khmer, Myanmar, and Lao confidence checks with explicit shaping/layout invariants.
- `layout-spacing-cmap.test.mjs`
  LayoutEngine spacing and cmap-specific edge cases.
- `coverage-extra.test.mjs`
  Broad fixture and table-format coverage.
- `fuzz-untrusted-fonts.test.mjs`
  Robustness against malformed input.
- `perf-*.mjs`
  Benchmarking, profiling, and memory-retention checks.
- `golden/`
  Visual regression tooling.

Files that still read like catch-alls and should be split later:

- `coverage-extra.test.mjs`

## Common Commands

- `npm test`
  Fast default suite (`tests/*.test.mjs`).
- `npm run test:full`
  Full sweep with heavier fixture coverage.
- `npm run test:coverage`
  Coverage report.
- `npm run test:coverage:full`
  Full sweep + coverage.

## Advanced Commands

- `npm run test:perf`
  Perf report.
- `npm run test:perf:enforce`
  Perf budget gate.
- `npm run test:perf:profile`
  Perf profiling run.
- `npm run test:perf:memory`
  Memory-retention/perf checks.
- `npm run test:golden:validate`
  Validate golden target configuration.
- `npm run test:golden:capture`
  Capture current screenshots for golden workflow.
- `npm run test:golden:compare`
  Compare baseline vs current screenshots.
- `npm run test:golden:between -- --base <sha> --head <sha>`
  Compare screenshots between two commits.

Golden workflow details, required targets, and CI behavior:
- `tests/golden/README.md`
