# fontparser CLI (prototype)

This is an early CLI for inspecting language coverage and writing a modified font file.

## Usage

```bash
cd /Users/byteface/Desktop/projects/js-font-parser
npm run build:dist
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --coverage
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --localise es --out /tmp/DiscoMo-es.ttf
```

## Notes
- `--coverage` prints language coverage based on required character sets.
- `--localise` writes a new font and attempts to compose missing Latin glyphs using base + combining marks.

## Limitations
- Composition currently targets BMP characters only (cmap format 4 rebuild).
- CFF/CFF2 fonts are not supported for writing yet.
- Some marks may be missing in the source font; those composites will be skipped.
