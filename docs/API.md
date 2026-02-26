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

## Tables
```js
import { Table } from "./dist/table/Table.js";
const gsub = font.getTableByType(Table.GSUB);
const gpos = font.getTableByType(Table.GPOS);
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

## Metadata
```js
font.getNameRecord(1); // family name
font.getAllNameRecords(); // array of { nameId, record }
```

## Notes
- Composite glyphs are partially supported.
- The demos in `demos/` show how to draw contours to a canvas.
