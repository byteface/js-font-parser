## Test Layout

The suite is grouped by concern rather than by discovery order.

- `basic.test.mjs`
  Core library smoke coverage.
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
- `woff-*.test.mjs`
  WOFF decode, diagnostics, and layout edge cases.
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

- `edge-busters.test.mjs`
- `edge-high-impact.test.mjs`
