# Wishlist

## Prioritized (easiest → hardest)
1. **Metadata API expansion** — more OS/2 + post helpers (selection flags, naming convenience).
2. **Golden‑image tests** — add rendering regression tests for key demos.
3. **Better layout engine** — wrap/align/justify/space controls are in; RTL preview added; remaining: bidi, script‑aware line breaking, hyphenation.
4. **Contextual GSUB shaping (complex scripts)** — GDEF mark filtering is wired; remaining: real‑font validation (Arabic/Indic) and any remaining mark‑set edge cases.
5. **CFF2 variable outlines (OTF)** — blend uses correct region indices; remaining: validate axis extremes on CFF2 var fonts + composite/edge cases.
6. **gvar interpolation** — solid for simple glyphs; remaining: composite glyphs + phantom‑point correctness.
7. **Full GPOS positioning across scripts** — mark‑to‑mark + base/ligature anchors improved; remaining: complex mark/ligature combos + script validation.
8. **WOFF2 support** — decode Brotli‑compressed tables.

## Done (recent)
- **COLRv1 paint tables** — varStore deltas + ClipList masks (incl. ClipBoxVar).
- **SVG glyph rendering** — transforms normalized; demo stable across samples.
- **Kerning visualizer** — upgraded `tools/kerning.html` to an interactive pair heatmap + rendering comparison demo.

## New Wishlist (additional ideas)
1. **Font diff tool** — compare two fonts and highlight glyph/metric/table differences.
2. **Kerning visualizer** — implemented in `tools/kerning.html` (interactive grid heatmap + stronger kerning font set).
3. **Glyph SVG export batch** — export selected glyphs or full set as individual SVG files.
4. **Font subset builder** — generate a new font containing only specified characters.
5. **Unicode coverage map** — show coverage by Unicode block with missing glyphs highlighted.
6. **Glyph path simplifier** — reduce points while preserving shape (for optimization).
7. **Auto‑hinting preview** — show hinted vs unhinted outlines (visual diff).
8. **Metrics inspector** — visualize ascender/descender/x‑height/cap height on glyphs.
9. **Baseline/grid overlay demo** — configurable typographic grid for layout debugging.
10. **Font table explorer** — raw table viewer with offsets/hex + parsed summary side‑by‑side.
