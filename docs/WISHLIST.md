# Wishlist

## Prioritized (easiest → hardest)
1. **Golden‑image tests** — add rendering regression tests for key demos.
2. **Contextual GSUB shaping (complex scripts)** — GDEF mark filtering is wired; remaining: real‑font validation (Arabic/Indic) and any remaining mark‑set edge cases.
3. **CFF2 variable outlines (OTF)** — blend uses correct region indices; remaining: validate axis extremes on CFF2 var fonts + composite/edge cases.
4. **gvar interpolation** — solid for simple glyphs; remaining: composite glyph deltas + component‑transform deltas.
5. **Full GPOS positioning across scripts** — mark‑to‑mark + base/ligature anchors improved; remaining: complex mark/ligature combos + script validation.
6. **WOFF2 support** — decode Brotli‑compressed tables (needs decoder or bundled wasm).

## Done (recent)
- **COLRv1 paint tables** — varStore deltas + ClipList masks (incl. ClipBoxVar).
- **SVG glyph rendering** — transforms normalized; demo stable across samples.
- **Kerning visualizer** — upgraded `tools/kerning.html` to an interactive pair heatmap + rendering comparison demo.
- **Metadata API expansion** — OS/2 + post helpers + selection flags + naming convenience.
- **Layout engine** — wrap/align/justify/space controls + RTL auto + soft‑hyphen + simple bidi.

## New Wishlist (additional ideas)
1. **Font diff tool** — compare two fonts and highlight glyph/metric/table differences.
2. **Glyph SVG export batch** — export selected glyphs or full set as individual SVG files.
3. **Font subset builder** — generate a new font containing only specified characters.
4. **Unicode coverage map** — show coverage by Unicode block with missing glyphs highlighted.
5. **Glyph path simplifier** — reduce points while preserving shape (for optimization).
6. **Auto‑hinting preview** — show hinted vs unhinted outlines (visual diff).
7. **Metrics inspector** — visualize ascender/descender/x‑height/cap height on glyphs.
8. **Baseline/grid overlay demo** — configurable typographic grid for layout debugging.
9. **Font table explorer** — raw table viewer with offsets/hex + parsed summary side‑by‑side.
