# Demo Notes

## Known Limitations
- **CFF/CFF2 (OTF) outlines** are not supported yet. Fonts with `CFF ` tables will not render.
- **Complex script shaping (GSUB/GPOS)** is not implemented. Arabic/Devanagari will render unshaped.
- **Composite glyphs** are partially supported; some fonts may still render incorrectly.

## Demo Pipeline
All demos in `demos/` now use the TS/ESM pipeline (`dist/` outputs).

## Feature Coverage
- `demos/features.html` shows GSUB/GPOS script and feature tags. GPOS subtables are not parsed yet.
