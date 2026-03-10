# Support Matrix

This project is a browser-focused typography engine and font toolkit. It is designed for modern JavaScript runtimes, direct glyph access, shaping-aware layout, and custom rendering workflows.

## Runtime Support

### Node

- Supported for development and CI: Node `20.x`, `22.x`, `24.x`
- Recommended local runtime: use the version pinned in `.nvmrc`

### Browsers

- Target: modern evergreen browsers
- Expected baseline: current Chromium, Firefox, and Safari releases with ES module support
- Not a target: legacy browsers that depend on ES5-era output

Notes:

- The browser bundle is aimed at modern environments.
- Some optional features depend on browser APIs or external runtime setup.

## Format Support

### Works out of the box

- `TTF`
- `OTF/CFF`
- `WOFF`

### Works with runtime decoder setup

- `WOFF2`

`WOFF2` support is part of the library, but it requires a decoder to be wired through the documented hooks:

- `setWoff2Decoder(...)`
- `setWoff2DecoderAsync(...)`
- or a compatible global decoder path

The repo includes browser-oriented examples and smoke fixtures for this setup.

## Shaping and Layout Confidence

### Strongest coverage

These areas have explicit regression coverage and real-font sign-off style tests:

- Latin
- Arabic
- Devanagari
- Bengali
- Hebrew
- Thai

### Exercised, but not claimed as fully signed off

These are represented in fixtures and general parser/layout coverage, but should be treated as lower-confidence than the groups above:

- Malayalam
- Sinhala
- Telugu
- Myanmar
- Lao
- Tibetan
- broader variable-font and color-font combinations outside the primary regression set

### Layout Scope

The library supports:

- glyph mapping
- GSUB/GPOS-aware shaping helpers
- kerning
- mark attachment
- script-aware layout entry points
- custom wrapping/alignment via `LayoutEngine`

The library does not aim to exactly match native browser text layout in every case.

## Rendering Scope

Strong fit:

- canvas rendering with explicit glyph control
- SVG export
- custom text and glyph visualization tools
- creative coding and font-inspection workflows

Not promised:

- parity with browser-native text rasterization
- native text-engine hinting quality
- platform-identical line breaking or shaping behavior in every script/runtime combination

## Current Non-Goals

These are not current promises of the project:

- full replacement for browser or native text engines
- TrueType hint VM execution
- exact raster parity with platform text rendering
- broad legacy-browser support
- zero-setup WOFF2 in every runtime

## Practical Reading

If you want:

- direct access to glyphs, outlines, metrics, tables, and shaping-aware layout in modern JS: supported
- browser-native text replacement with native-quality hinting or raster parity: out of scope
- WOFF2 support: supported with documented decoder setup
