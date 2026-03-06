# API

Current public API for loading and inspecting TTF/OTF/WOFF/WOFF2 fonts.

## Package Exports

Top-level exports from `dist/index.js`:

```js
import {
  FontParser,
  FontParserTTF,
  FontParserWOFF,
  FontParserWOFF2,
  GlyphData,
  SVGFont,
  CanvasRenderer,
  CanvasGlyph,
  LayoutEngine,
  getSupportedLanguages,
  supportsLanguage,
  listLanguages,
  setWoff2Decoder,
  detectScriptTags,
  Color
} from "./dist/index.js";
```

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

`LayoutEngine` is also exported for generic line wrapping/alignment:

```js
const layout = LayoutEngine.layoutText(font, "hyphen\u00ADation sample", {
  maxWidth: 1200,
  align: "justify",          // left | center | right | justify
  direction: "auto",         // ltr | rtl | auto
  useKerning: true,
  letterSpacing: 0,
  breakWords: true,
  trimLeadingSpaces: true,
  trimTrailingSpaces: true,
  collapseSpaces: false,
  preserveNbsp: true,
  tabSize: 4,
  justifyLastLine: false,
  bidi: "simple",            // none | simple
  hyphenate: "soft",         // none | soft
  hyphenChar: "-",
  hyphenMinWordLength: 6
});
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

## Language Coverage Helpers

```js
const all = getSupportedLanguages(font);
// -> [{ code, name, supported, missing, coverage, notes? }, ...]

const fr = supportsLanguage(font, "fr");
// -> { code, name, supported, missing, coverage, notes? } | null

const defs = listLanguages();
// -> [{ code, name, required, optional?, notes? }, ...]
```

## Script Detection Helper

```js
const { scripts, features } = detectScriptTags("مرحبا Hello");
// scripts: e.g. ["arab", "latn"]
// features: merged recommended GSUB features for detected scripts
```

## WOFF2 Decoder Hook

```js
setWoff2Decoder((compressedBytes) => decodedTtfBytes);
// compressedBytes: Uint8Array (WOFF2 payload)
// return: Uint8Array (decoded sfnt/TTF bytes)
```

## Color Utility

```js
Color.rndColor();
Color.rgbaToCss(255, 0, 0, 0.5);
Color.hexToRgba("#336699cc");
Color.blend({ r: 255, g: 0, b: 0, a: 0.5 }, { r: 0, g: 0, b: 0, a: 1 });
Color.paletteToCss([{ red: 255, green: 0, blue: 0, alpha: 255 }]);
```

## Diagnostics

`FontParserTTF` and `FontParserWOFF` expose structured diagnostics:

```js
font.clearDiagnostics();
font.layoutString("Hello", { gpos: true });

const all = font.getDiagnostics();
const parseOnly = font.getDiagnostics({ phase: "parse" });
const warnings = font.getDiagnostics({ level: "warning" });
const missingGpos = font.getDiagnostics({ code: "MISSING_TABLE_GPOS" });
const allMissing = font.getDiagnostics({ code: /^MISSING_/ });
```

Layout diagnostics can be captured via `LayoutEngine`:

```js
const diagnostics = [];
LayoutEngine.layoutText(font, "hy\u00ADphen ?", {
  maxWidth: 300,
  diagnostics,
  onDiagnostic: (d) => {
    // optional callback
  }
});
```

Current diagnostic codes:
- `INVALID_CHAR_INPUT`
- `MULTI_CHAR_INPUT`
- `CODE_POINT_RESOLVE_FAILED`
- `MISSING_TABLE_CMAP`
- `MISSING_CMAP_FORMAT`
- `MISSING_TABLE_GSUB`
- `MISSING_TABLE_GPOS`
- `UNSUPPORTED_GPOS_SUBTABLE`
- `MISSING_GLYPH` (layout)
- `SOFT_HYPHEN_FALLBACK` (layout)

## Notes

- `FontParser.load(...)` returns a parser instance for the detected format.
- WOFF2 parsing requires a decoder in your runtime (set via `setWoff2Decoder(...)` or global `WOFF2.decode(...)`).
- Some methods are format-dependent (for example, `layoutStringAuto` is currently on `FontParserTTF`).
