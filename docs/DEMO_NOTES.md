# Demo Notes

## Known Limitations
- **CFF/CFF2 (OTF) outlines** are not supported yet. Fonts with `CFF ` tables will not render.
- **Complex script shaping (GSUB/GPOS)** is not implemented. Arabic/Devanagari will render unshaped.
- **Composite glyphs** are detected but not resolved yet.

## Demo Pipeline
All demos in `demos/` now use the TS/ESM pipeline (`dist/` outputs).
