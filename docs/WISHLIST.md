# Wishlist

## Font Format Support
- [ ] **CFF/CFF2 outlines (OTF)**: parse `CFF ` / `CFF2` tables and Type 2 charstrings.
- [ ] **Shaping (GSUB/GPOS)**: parse lookup subtables and apply shaping rules for complex scripts (Arabic, Devanagari, etc).
- [ ] **GPOS lookups**: parse positioning subtables (kern, mark, cursive, etc). Current support is header + lists only.

## Demos
- [x] Multilingual text demo with per-script fonts.
- [x] Tables overview demo with per-table summaries.

## Docs
- [x] Expanded API docs with rendering helpers and common patterns.

## Top 10 Next
1. CFF/CFF2 (OTF) outlines
2. GSUB shaping engine (apply substitutions to strings)
3. GPOS positioning (kerning/marks/cursive)
4. Script + language selection and feature toggles
5. Full SVG font export (OTF/TTF to embedded SVG font)
6. WOFF2 support
7. Better layout engine (line breaking, alignment)
8. Robust composite glyph rendering across more fonts
9. Golden-image tests for demo rendering
10. Expanded metadata API (name/OS2/post convenience surface)
