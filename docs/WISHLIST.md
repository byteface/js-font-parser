# Wishlist

## Prioritized (easiest -> hardest)
1. **CFF2 variable outlines (OTF)** — blend uses correct region indices; remaining: validate axis extremes on CFF2 var fonts + composite/edge cases.
2. **gvar interpolation** — solid for simple glyph deltas; remaining: component-transform and remaining composite edge cases.
3. **Full GPOS positioning across scripts** — mark-to-mark + base/ligature anchors improved, ligature component anchor selection fixed, Arabic/Devanagari real-font validation added; remaining: broader script corpus + additional complex mark/ligature fixtures.
4. **WOFF2 support** — decode Brotli-compressed tables (decoder packaging/runtime strategy still open).


## New Wishlist (additional ideas)
1. **Font diff tool** — compare two fonts and highlight glyph/metric/table differences.
2. **Glyph path simplifier** — reduce points while preserving shape (for optimization).
3. **Auto-hinting preview** — show hinted vs unhinted outlines (visual diff).
4. **Baseline/grid overlay demo** — configurable typographic grid for layout debugging.


upgrade node
inline documentation / clean code
clean tools to shared libs