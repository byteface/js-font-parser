# Demo Notes

## Known Limitations
- **CFF/CFF2 (OTF) outlines** are not supported yet. Fonts with `CFF ` tables will not render.
- **Complex script shaping (GSUB/GPOS)** is not implemented. Arabic/Devanagari will render unshaped.
- **Composite glyphs** are partially supported; some fonts may still render incorrectly.

## Demo Pipeline
All demos in `demos/` now use the TS/ESM pipeline (`dist/` outputs).

## Feature Coverage
- `demos/features.html` shows GSUB/GPOS script and feature tags. GPOS subtables are not parsed yet.
- `demos/tables.html` shows per-table summaries and presence/absence.
- `demos/svg-export.html` exports strings to SVG paths.
- `demos/gsub.html` previews GSUB ligature substitutions (when available).
- `demos/kerning.html` previews kerning adjustments from the kern table.
- `demos/layout-text.html` uses GSUB + kerning to build a layout.
- `demos/metrics.html` shows rulers + measurements for a single glyph and a sentence.
- `demos/path-tracing.html` uses SVG paths to trace strokes over time.
- `demos/morphing.html` morphs glyph point clouds between letters/words.
- `demos/breathing.html` applies organic wobble to contours.
