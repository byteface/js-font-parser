# TS Porting Audit

This repo is primarily TypeScript, but a few legacy files still exist (JS/AS). These are likely the remaining pieces that have not been ported.

## Unported Legacy Files

### ActionScript (`.as`)
- `com/byteface/font/table/ClassDef.as`
- `com/byteface/font/table/ClassDefFormat1.as`
- `com/byteface/font/table/ClassDefFormat2.as`
- `com/byteface/font/table/CvtTable.as`
- `com/byteface/font/table/Device.as`
- `com/byteface/font/table/FeatureTags.as`
- `com/byteface/font/table/FpgmTable.as`
- `com/byteface/font/table/GlyfDescript.as`
- `com/byteface/font/table/GposTable.as`
- `com/byteface/font/table/ScriptTags.as`

### JavaScript (`.js`)
- `com/byteface/font/draw/SVGFont.js`
- `com/byteface/font/constants/AllConstants.js`
- `com/byteface/font/constants/CSSConstants.js`
- `com/byteface/font/constants/SVGConstants.js`

## Recommended Port Order
1. **GlyfDescript / GposTable / ClassDef***: impacts glyph interpretation and layout.
2. **ScriptTags / FeatureTags**: needed for advanced OpenType features.
3. **CvtTable / FpgmTable / Device**: hinting and device adjustments.
4. **SVGFont / constants**: rendering helpers and SVG integration.
