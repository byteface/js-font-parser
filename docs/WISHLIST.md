# Wishlist

## Prioritized
1. **Contextual GSUB shaping (complex scripts)** — GDEF mark filtering is wired; remaining: mark‑set/attachment edge cases and real‑font validation (Arabic/Indic).
2. **CFF2 variable outlines (OTF)** — blend uses correct region indices; remaining: validate axis extremes on CFF2 var fonts and check composite/edge cases.
3. **Better layout engine** — wrap/align/justify/space controls are in; remaining: bidi, script‑aware line breaking, hyphenation.
4. **Full GPOS positioning across scripts** — pair/mark/cursive basics work; remaining: complex mark/ligature combinations + script coverage validation.
5. **gvar interpolation** — solid for simple glyphs; remaining: composite glyphs + phantom‑point correctness.
6. **COLRv1 paint tables** — formats 1–32 render; remaining: apply varStore deltas + ClipList masks.
7. **SVG glyph rendering** — works for sample fonts; remaining: normalize transforms + broaden font coverage.
8. **Golden‑image tests** — add rendering regression tests for key demos.
9. **WOFF2 support** — decode Brotli‑compressed tables.
10. **Metadata API expansion** — more OS/2 + post helpers (selection flags, naming convenience).
