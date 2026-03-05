# API

Current public API for loading and inspecting TTF/OTF/WOFF/WOFF2 fonts.

## Loading

Use the unified loader in most cases:

```js
import { FontParser } from "./dist/data/FontParser.js";

const font = await FontParser.load("truetypefonts/DiscoMo.ttf");
```

From raw bytes:

```js
const font = FontParser.fromArrayBuffer(arrayBuffer);
```

Direct loaders are also available:

```js
import { FontParserTTF } from "./dist/data/FontParserTTF.js";
import { FontParserWOFF } from "./dist/data/FontParserWOFF.js";
import { FontParserWOFF2 } from "./dist/data/FontParserWOFF2.js";
```

## Character and Glyph Mapping

```js
font.getGlyphIndexByChar("H");               // number | null
font.getGlyphByChar("H");                    // GlyphData | null
font.getGlyphIndicesForString("hello");      // number[] (TTF)
font.getGlyphIndicesForStringWithGsub("office", ["liga"], ["DFLT", "latn"]);
```

## Layout and Kerning

```js
font.getKerningValue("A", "V");
font.getKerningValueByGlyphs(leftGlyph, rightGlyph);
font.getGposKerningValueByGlyphs(leftGlyph, rightGlyph);

font.layoutString("Hello", {
  gsubFeatures: ["liga"],
  scriptTags: ["DFLT", "latn"],
  gpos: true,
  gposFeatures: ["kern", "mark", "mkmk", "curs"]
});
```

`FontParserTTF` also exposes:

```js
font.layoutStringAuto("مرحبا"); // auto-detects script/features
```

## Variation Fonts

```js
font.getVariationAxes();
font.setVariationCoords([0, 0.5, -0.25]);
font.setVariationByAxes({ wght: 700, wdth: 95 });
```

## Metrics

```js
font.getNumGlyphs();
font.getAscent();
font.getDescent();
```

## Glyph Data

```js
const glyph = font.getGlyph(42);
if (glyph) {
  glyph.getPointCount();
  glyph.getPoint(0); // { x, y, onCurve, endOfContour }
  glyph.advanceWidth;
}
```

## Color and SVG

```js
font.getColorLayersForGlyph(glyphId, 0);
font.getColorLayersForChar("A", 0);

await font.getSvgDocumentForGlyphAsync(glyphId);
// -> { svgText: string | null, isCompressed: boolean }
```

## GPOS Anchor Introspection

```js
font.getMarkAnchorsForGlyph(glyphId);
// -> [{ type, classIndex, x, y }, ...]
```

## Table Access

```js
import { Table } from "./dist/table/Table.js";

font.getTableByType(Table.GSUB);
font.getTableByType(Table.GPOS);
font.getTableByType(Table.pName);
```

## Metadata API

```js
// Legacy name-table helpers
font.getNameRecord(1);
font.getAllNameRecords();
font.getAllNameRecordsDetailed();

// Convenience surface (name/OS2/post)
font.getFontNames();
font.getOs2Metrics();
font.getPostMetrics();
font.getWeightClass();
font.getWidthClass();
font.getFsTypeFlags();
font.getFsSelectionFlags();
font.isBold();
font.isItalic();
font.isMonospace();
font.getMetadata();
```

## Rendering

```js
import { CanvasRenderer } from "./dist/render/CanvasRenderer.js";

CanvasRenderer.drawString(font, "Hello", canvas, {
  x: 20,
  y: 140,
  scale: 0.12,
  styles: { fillStyle: "#111", strokeStyle: "#111" }
});
```

## Notes

- `FontParser.load(...)` returns a parser instance for the detected format.
- WOFF2 parsing requires a WOFF2 decoder (`decodeWoff2`) in your runtime.
- Some methods are format-dependent (for example, `layoutStringAuto` is currently on `FontParserTTF`).
