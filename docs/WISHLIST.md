# Wishlist

## Font Format Support
- [x] **CFF outlines (OTF)**: basic `CFF ` parsing and Type 2 charstrings.
- [~] **CFF2 outlines (OTF)**: basic outlines render, variable CFF2 incomplete.
- [ ] **WOFF2**: decode Brotli-compressed tables.
- [ ] **COLRv1**: parse Paint tables (COLR v1).
- [ ] **SVG glyphs**: parse and render `SVG ` table glyphs.

## Layout + Shaping
- [x] **Shaping (GSUB)**: apply single + ligature substitutions during layout (contextual not yet supported).
- [x] **Positioning (GPOS)**: apply marks/cursive/pairs during layout.
- [x] **GPOS lookups**: parse pair/mark/cursive subtables and expose anchors + kerning.

## Variable Fonts
- [ ] **gvar**: interpolate outlines by axis values.

## Demos
- [x] Multilingual text demo with per-script fonts.
- [x] Tables overview demo with per-table summaries.

## Docs
- [x] Expanded API docs with rendering helpers and common patterns.

## Top 10 Next
1. WOFF2 support
2. CFF2 (OTF) outlines (finish variable CFF2)
3. Better layout engine (line breaking, alignment)
4. Contextual GSUB shaping (complex scripts)
5. Full GPOS positioning (mark/ligature/cursive across scripts)
6. gvar interpolation for variable fonts
7. SVG glyph table rendering
8. COLRv1 paint table support
9. Expanded metadata API (name/OS2/post convenience surface)
10. Golden-image tests for demo rendering
