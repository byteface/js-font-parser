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
- [~] **gvar**: interpolate outlines by axis values (experimental; no IUP deltas yet).

## Demos
- [x] Multilingual text demo with per-script fonts.
- [x] Tables overview demo with per-table summaries.

## Docs
- [x] Expanded API docs with rendering helpers and common patterns.

## Top 10 Next
1. CFF2 (OTF) outlines (finish variable CFF2)
2. Better layout engine (line breaking, alignment)
3. Contextual GSUB shaping (complex scripts)
4. Full GPOS positioning (mark/ligature/cursive across scripts)
5. gvar interpolation for variable fonts
6. SVG glyph table rendering
7. COLRv1 paint table support
8. Expanded metadata API (name/OS2/post convenience surface)
9. Golden-image tests for demo rendering
10. WOFF2 support (deferred: no sample fonts yet)
