# Wishlist

## Prioritized (easiest -> hardest)
1. **Golden-image tests** — add rendering regression tests for key demos.
2. **gvar interpolation** — solid for simple glyph deltas; remaining: component-transform deltas (risky) + remaining composite edge cases.
3. **Full GPOS positioning across scripts** — mark-to-mark + base/ligature anchors improved; remaining: complex mark/ligature combos + script validation.
4. **WOFF2 support** — decode Brotli-compressed tables (decoder packaging/runtime strategy still open).


## Done (recent)
- **CFF2 variable outlines (OTF)** — axis extremes + sweep tests confirm stable outlines.

## New Wishlist (additional ideas)
1. **Font diff tool** — compare two fonts and highlight glyph/metric/table differences.
2. **Glyph path simplifier** — reduce points while preserving shape (for optimization).
3. **Auto-hinting preview** — show hinted vs unhinted outlines (visual diff).
4. **Baseline/grid overlay demo** — configurable typographic grid for layout debugging.
