# JS Font Parser

Parse `TTF`, `OTF`, `WOFF`, and `WOFF2` fonts in JavaScript and work with glyph geometry, metrics, shaping, metadata, and renderable output.

This library is built for creative coding, font inspection, layout experiments, and custom rendering pipelines. It can load fonts, map characters to glyphs, apply GSUB/GPOS shaping, expose outline points, and render through SVG or canvas helpers.

## Install

```bash
nvm use
npm install
npm run build:dist
```

Use Node `22` via [.nvmrc](/Users/byteface/Desktop/projects/js-font-parser/.nvmrc). The package is native ESM and exports from [dist/index.js](/Users/byteface/Desktop/projects/js-font-parser/dist/index.js).

## Quick Example

```js
import { FontParser, LayoutEngine, SVGFont } from "./dist/index.js";

const font = await FontParser.load("truetypefonts/noto/NotoSans-Regular.ttf");

const glyph = font.getGlyphByChar("A");
console.log(glyph?.advanceWidth);

const shaped = font.layoutString("office", {
  gsubFeatures: ["liga"],
  scriptTags: ["DFLT", "latn"],
  gpos: true
});

const wrapped = LayoutEngine.layoutText(font, "Hello world from js-font-parser", {
  maxWidth: 1400,
  align: "left",
  direction: "ltr"
});

const svg = SVGFont.exportStringSvg(font, "Hello", {
  x: 40,
  y: 180,
  fontSize: 120
});
```

## Main Exports

Top-level exports from [src/index.ts](/Users/byteface/Desktop/projects/js-font-parser/src/index.ts):

- `FontParser`, `FontParserTTF`, `FontParserWOFF`, `FontParserWOFF2`
- `GlyphData`
- `LayoutEngine`
- `SVGFont`
- `CanvasRenderer`, `CanvasGlyph`
- `setWoff2Decoder`
- `detectScriptTags`
- `getSupportedLanguages`, `supportsLanguage`, `listLanguages`

## Common Tasks

Load a font:

```js
import { FontParser } from "./dist/index.js";

const font = await FontParser.load("truetypefonts/DiscoMo.ttf");
```

Inspect glyphs and metrics:

```js
font.getGlyphIndexByChar("H");
font.getGlyphByChar("H");
font.getUnitsPerEm();
font.getAscent();
font.getDescent();
font.measureText("Hello", { gpos: true });
```

Shape text:

```js
font.layoutString("مرحبا", {
  gpos: true,
  gposFeatures: ["kern", "mark", "mkmk", "curs"]
});

font.layoutStringAuto("नमस्ते");
```

Convert shaped text to outline points:

```js
font.layoutToPoints("Hello", {
  x: 80,
  y: 300,
  fontSize: 160,
  sampleStep: 1,
  gpos: true
});
```

Render:

```js
import { CanvasRenderer, SVGFont } from "./dist/index.js";

CanvasRenderer.drawString(font, "Hello", canvas, {
  x: 20,
  y: 140,
  scale: 0.12
});

SVGFont.exportStringSvg(font, "Hello", {
  x: 20,
  y: 140,
  fontSize: 120
});
```

If you need wrapped lines, alignment, bidi-aware ordering, or soft-hyphen handling, use `LayoutEngine.layoutText(...)` on top of the parser surface.

## WOFF2

WOFF2 decoding needs a decoder at runtime. Register one through the public export:

```js
import { setWoff2Decoder } from "./dist/index.js";

setWoff2Decoder(async (buffer) => {
  return someDecoder(buffer);
});
```

If a global `WOFF2.decode()` exists, the library can use that as well.

## Docs

- [docs/API.md](/Users/byteface/Desktop/projects/js-font-parser/docs/API.md)
- [docs/WISHLIST.md](/Users/byteface/Desktop/projects/js-font-parser/docs/WISHLIST.md)
- [proj/fontparser/README.md](/Users/byteface/Desktop/projects/js-font-parser/proj/fontparser/README.md)
- [tests/golden/README.md](/Users/byteface/Desktop/projects/js-font-parser/tests/golden/README.md)

Use [docs/API.md](/Users/byteface/Desktop/projects/js-font-parser/docs/API.md) for the public API and [docs/WISHLIST.md](/Users/byteface/Desktop/projects/js-font-parser/docs/WISHLIST.md) for current limits and remaining work.

## Development

Build:

```bash
npm run build:dist
npm run build:bundle
```

Tests:

```bash
npm test
npm run test:coverage
npm run test:perf
npm run test:perf:profile
```

Visual regression tools:

```bash
npm run test:golden:capture
npm run test:golden:compare
npm run test:golden:approve
npm run test:golden:between -- --base <sha> --head <sha>
```

Run demos and browser tools over HTTP, not `file://`:

```bash
python3 -m http.server 8080
```

Bundle output is written to [dist-build/fontparser.min.js](/Users/byteface/Desktop/projects/js-font-parser/dist-build/fontparser.min.js).
