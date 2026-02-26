# API

This is a minimal reference for the current public surface. It focuses on the path that works today: loading a font, mapping characters to glyphs, and rendering points.

## Loading
```js
import { FontParserTTF } from "./dist/data/FontParserTTF.js";

FontParserTTF.load("truetypefonts/DiscoMo.ttf").then((font) => {
  // use font
});
```

## Character To Glyph
```js
const glyphIndex = font.getGlyphIndexByChar("H"); // number | null
const glyph = font.getGlyphByChar("H");           // GlyphData | null
```

## String Mapping
```js
const indices = font.getGlyphIndicesForString("hello world");
```

## Glyph Data
```js
const glyph = font.getGlyph(42);
if (glyph) {
  const count = glyph.getPointCount();
  const p0 = glyph.getPoint(0); // { x, y, onCurve, endOfContour }
  const advance = glyph.advanceWidth;
}
```

## Metrics
```js
font.getNumGlyphs();
font.getAscent();
font.getDescent();
```

## Notes
- Composite glyphs are detected but not yet resolved.
- The demos in `examples/` show how to draw contours to a canvas.
