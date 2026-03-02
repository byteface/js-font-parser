# Wishlist

## Font Format Support
- [ ] **CFF/CFF2 outlines (OTF)**: parse `CFF ` / `CFF2` tables and Type 2 charstrings.
- [ ] **WOFF2**: decode Brotli-compressed tables.
- [ ] **COLRv1**: parse Paint tables (COLR v1).
- [ ] **SVG glyphs**: parse and render `SVG ` table glyphs.

## Layout + Shaping
- [ ] **Shaping (GSUB)**: apply substitutions to strings for complex scripts (Arabic, Devanagari, etc).
- [ ] **Positioning (GPOS)**: apply marks/cursive/pairs during layout.
- [x] **GPOS lookups**: parse pair/mark/cursive subtables and expose anchors + kerning.

## Variable Fonts
- [ ] **gvar**: interpolate outlines by axis values.

## Demos
- [x] Multilingual text demo with per-script fonts.
- [x] Tables overview demo with per-table summaries.

## Docs
- [x] Expanded API docs with rendering helpers and common patterns.

## Top 10 Next
1. CFF/CFF2 (OTF) outlines
2. GSUB shaping engine (apply substitutions to strings)
3. GPOS positioning engine (marks/cursive/ligatures during layout)
4. gvar interpolation for variable fonts
5. COLRv1 paint table support
6. WOFF2 support
7. SVG glyph table rendering
8. Better layout engine (line breaking, alignment)
9. Golden-image tests for demo rendering
10. Expanded metadata API (name/OS2/post convenience surface)
