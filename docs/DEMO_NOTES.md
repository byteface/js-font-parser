# Demo Notes

## Known Limitations
- **CFF/CFF2 (OTF) outlines** are not supported yet. Fonts with `CFF ` tables will not render.
- **Complex script shaping (GSUB/GPOS)** is not implemented. Arabic/Devanagari will render unshaped.
- **Composite glyphs** are detected but not resolved yet.

## Legacy Demos
`demos/legacy/` contains older experiments that still rely on legacy JS and may not reflect the latest APIs. Use them as reference or inspiration; they may need manual fixes to run cleanly.
