# TS Porting Audit

This repo is primarily TypeScript, but a few legacy files still exist (JS/AS). These are likely the remaining pieces that have not been ported.

## Unported Legacy Files

### JavaScript (`.js`)
- `com/byteface/font/draw/SVGFont.js`
- `com/byteface/font/constants/AllConstants.js`
- `com/byteface/font/constants/CSSConstants.js`
- `com/byteface/font/constants/SVGConstants.js`

## Recommended Port Order
1. **SVGFont / constants**: rendering helpers and SVG integration.
