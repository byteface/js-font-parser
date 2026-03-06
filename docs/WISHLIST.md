# Wishlist

## Prioritized (easiest -> hardest)
1. **CFF2 variable outlines (OTF)** — blend uses correct region indices; remaining: validate axis extremes on CFF2 var fonts + composite/edge cases.
2. **gvar interpolation** — solid for simple glyph deltas; remaining: component-transform and remaining composite edge cases.
3. **Full GPOS positioning across scripts** — mark-to-mark + base/ligature anchors improved; remaining: complex mark/ligature combos + script validation.
4. **WOFF2 support** — decode Brotli-compressed tables (decoder packaging/runtime strategy still open).

## Done (recent)
- **Golden-image tests** — `tests/golden` scripts + CI workflow + commit-to-commit comparison + baseline approval flow.
- **Contextual GSUB shaping (complex scripts)** — real-font Arabic/Indic validation + mark-filtering-set and mark-attachment edge-case coverage.
- **COLRv1 paint tables** — varStore deltas + ClipList masks (incl. ClipBoxVar).
- **SVG glyph rendering** — transforms normalized; demo stable across samples.
- **Kerning visualizer** — upgraded `tools/kerning.html` to an interactive pair heatmap + rendering comparison demo.
- **Metadata API expansion** — OS/2 + post helpers + selection flags + naming convenience.
- **Layout engine** — wrap/align/justify/space controls + RTL auto + soft-hyphen + simple bidi.
- **Glyph SVG export batch** — implemented in `tools/svg-export.html` (chars/range/full-set batch + per-file download).
- **Metrics inspector** — expanded in `tools/metrics.html` (side-by-side font comparison + metric rulers).
- **Font table explorer** — expanded in `tools/tables.html` (table list with offsets/checksums + parsed/hex split view).

## New Wishlist (additional ideas)
1. **Font diff tool** — compare two fonts and highlight glyph/metric/table differences.
2. **Glyph path simplifier** — reduce points while preserving shape (for optimization).
3. **Auto-hinting preview** — show hinted vs unhinted outlines (visual diff).
4. **Baseline/grid overlay demo** — configurable typographic grid for layout debugging.
