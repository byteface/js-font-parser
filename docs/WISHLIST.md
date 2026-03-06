# Wishlist

## Prioritized (easiest → hardest)
1. **Contextual GSUB shaping (complex scripts)** — GDEF mark filtering is wired; remaining: real‑font validation (Arabic/Indic) and any remaining mark‑set edge cases.
2. **CFF2 variable outlines (OTF)** — blend uses correct region indices; remaining: validate axis extremes on CFF2 var fonts + composite/edge cases.
3. **gvar interpolation** — solid for simple glyphs; remaining: composite glyphs + phantom‑point correctness.
4. **Full GPOS positioning across scripts** — mark‑to‑mark + base/ligature anchors improved; remaining: complex mark/ligature combos + script validation.
5. **WOFF2 support** — decode Brotli‑compressed tables.


## New Wishlist (additional ideas)
1. **Font diff tool** — compare two fonts and highlight glyph/metric/table differences.
2. **Glyph SVG export batch** — export selected glyphs or full set as individual SVG files.
5. **Glyph path simplifier** — reduce points while preserving shape (for optimization).
6. **Auto‑hinting preview** — show hinted vs unhinted outlines (visual diff).
7. **Metrics inspector** — visualize ascender/descender/x‑height/cap height on glyphs.
8. **Baseline/grid overlay demo** — configurable typographic grid for layout debugging.
9. **Font table explorer** — raw table viewer with offsets/hex + parsed summary side‑by‑side.
