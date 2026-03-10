# JS Font Parser

[![npm version](https://img.shields.io/npm/v/js-font-parser.svg)](https://www.npmjs.com/package/js-font-parser)
[![npm downloads](https://img.shields.io/npm/dm/js-font-parser.svg)](https://www.npmjs.com/package/js-font-parser)
[![license: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)
[![repo](https://img.shields.io/badge/github-byteface%2Fjs--font--parser-black.svg)](https://github.com/byteface/js-font-parser)

Parse TTF/OTF/WOFF fonts, inspect OpenType tables, shape/layout text, and render glyph paths to canvas/SVG for creative and tooling workflows.

## Why This Library

- One package for parser, shaping, geometry extraction, and rendering helpers.
- Useful for both production-like text layout checks and experimental visuals.
- Works well for demos/tools while still exposing low-level table access.

## Install

```bash
npm install js-font-parser
```

```js
import { FontParser } from "js-font-parser";
```

## Quick Example

```js
import fs from "node:fs/promises";
import { FontParser } from "js-font-parser";

const bytes = await fs.readFile("./MyFont.ttf");
const parser = new FontParser(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

const text = "Hello world";
const fontSize = 72;
const width = parser.measureText(text, fontSize, { useKerning: true });
const points = parser.layoutToPoints(text, fontSize, { useKerning: true });

console.log({ width, pointCount: points.length });
```

## What You Get

- Parse: TTF, OTF/CFF/CFF2, WOFF, WOFF2 (decoder required at runtime).
- Access font metadata and parsed table structures.
- Layout text with kerning, GSUB substitutions, and GPOS positioning support.
- Extract glyph outlines/points for animation, physics, particles, and custom drawing.
- Render via included helpers for canvas and SVG workflows.

## Format Support Snapshot

| Area | Status |
| --- | --- |
| TTF / glyf+loca parsing | Supported |
| OTF / CFF and CFF2 parsing | Supported |
| WOFF 1 parsing | Supported |
| WOFF2 parsing | Supported (runtime decoder required) |
| GSUB/GPOS shaping | Supported (broad coverage) |
| TrueType hint VM execution | Not fully implemented |

## Public API (high-level)

- `FontParser`
- `Table`
- `CanvasGlyph`
- `CanvasRenderer`
- `SVGFont`
- `setWoff2Decoder`

See full API docs: [docs/API.md](docs/API.md).

## WOFF2 Runtime Decoder

WOFF2 decoding needs a decoder implementation at runtime. Provide one with `setWoff2Decoder(...)` or by exposing global `WOFF2.decode()`.

## Demos and Tools

Run locally:

```bash
npm install
npm run build
python3 -m http.server 8080
```

Open:

- `http://localhost:8080` (landing page)
- `http://localhost:8080/demos/`
- `http://localhost:8080/tools/`

## Scripts

- `npm test` fast test suite.
- `npm run test:full` full suite (`FULL_SWEEP=1`).
- `npm run test:coverage` coverage for fast suite.
- `npm run test:coverage:full` coverage for full sweep.
- `npm run test:perf` parse/layout performance report.
- `npm run test:perf:enforce` performance budgets.
- `npm run test:golden:capture` capture visual snapshots.
- `npm run test:golden:compare` compare baseline vs current snapshots.
- `npm run build:dist` compile TypeScript to `dist/`.
- `npm run build:bundle` build `dist-build/fontparser.min.js`.
- `npm run build` build dist + bundle.

## Limits / Current Gaps

- TrueType hint VM execution is not fully implemented (`fpgm`/`prep`/glyph instructions are read, not fully interpreted).
- WOFF2 requires external runtime decoder binding.
- Writing/subsetting currently focuses on TTF/glyf+loca workflows.

## Related Docs

- [docs/WISHLIST.md](docs/WISHLIST.md) current roadmap and priorities.
- [proj/fontparser/README.md](proj/fontparser/README.md) CLI usage and commands.
- [tests/golden/README.md](tests/golden/README.md) visual regression flow.
