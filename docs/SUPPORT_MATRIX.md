# Font Support Matrix

Status matrix for current parser/runtime support.

- `✅` = implemented
- blank = not implemented
- `n/a` = not applicable for that format

## Feature Matrix

| Feature | TTF | OTF | WOFF |
|---|---|---|---|
| Load/parse font | ✅ | ✅ | ✅ |
| Character mapping (`cmap`) | ✅ | ✅ | ✅ |
| Glyph lookup by char/index | ✅ | ✅ | ✅ |
| Basic metrics (`ascent/descent/numGlyphs`) | ✅ | ✅ | ✅ |
| Metadata API (`name`/`OS/2`/`post`) | ✅ | ✅ | ✅ |
| GSUB shaping helpers | ✅ | ✅ | ✅ |
| GPOS positioning helpers | ✅ | ✅ | ✅ |
| `kern` table kerning | ✅ | ✅ | ✅ |
| `layoutString(...)` | ✅ | ✅ | ✅ |
| `layoutStringAuto(...)` | ✅ | ✅ |  |
| Color glyph layers (COLR/CPAL) | ✅ | ✅ | ✅ |
| SVG glyph table extraction | ✅ | ✅ | ✅ |
| Variable axes (`fvar`) | ✅ | ✅ | ✅ |
| TrueType variations (`gvar`) | ✅ |  | ✅ |
| CFF outlines | ✅ | ✅ | ✅ |
| CFF2 outlines/variation | ✅ | ✅ |  |
| WOFF decompression path | n/a | n/a | ✅ |

## Table Parsing Matrix

| Table / Surface | TTF | OTF | WOFF |
|---|---|---|---|
| `head` | ✅ | ✅ | ✅ |
| `hhea` | ✅ | ✅ | ✅ |
| `hmtx` | ✅ | ✅ | ✅ |
| `maxp` | ✅ | ✅ | ✅ |
| `cmap` | ✅ | ✅ | ✅ |
| `name` | ✅ | ✅ | ✅ |
| `OS/2` | ✅ | ✅ | ✅ |
| `post` | ✅ | ✅ | ✅ |
| `glyf` | ✅ |  | ✅ |
| `loca` | ✅ |  | ✅ |
| `CFF ` | ✅ | ✅ | ✅ |
| `CFF2` | ✅ | ✅ |  |
| `GSUB` | ✅ | ✅ | ✅ |
| `GPOS` | ✅ | ✅ | ✅ |
| `kern` | ✅ | ✅ | ✅ |
| `COLR` | ✅ | ✅ | ✅ |
| `CPAL` | ✅ | ✅ | ✅ |
| `SVG ` | ✅ | ✅ | ✅ |
| `fvar` | ✅ | ✅ | ✅ |
| `gvar` | ✅ |  | ✅ |
| `cvt ` | ✅ | ✅ | ✅ |
| `fpgm` | ✅ | ✅ | ✅ |

## Notes

- OTF support is via the same parser surface as TTF; table availability still depends on the font.
- WOFF2 is supported via a separate decode path and is not shown in this three-format matrix.
