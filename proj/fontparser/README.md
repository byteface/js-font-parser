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
- `--localise` currently writes a new font by updating name table strings (proof of write).
- Composing missing glyphs is a planned next step.
