# JS Font Parser

Parse and inspect font files in JavaScript, then render and experiment with glyph geometry.

This project is for:
- font parsing, outline/table inspection, shaping/layout experiments
- demo/tooling workflows where you need direct access to points/contours/tables

This project is not a full browser text engine replacement.

## 30-Second Quick Start

```bash
nvm use
npm install
npm run build
npm test
```

Run local pages:

```bash
python3 -m http.server 8080
```

Open:
- `http://localhost:8080/demos/index.html`
- `http://localhost:8080/tools/index.html`

## Install and Use

### Node / Bundler

```js
import { FontParser, CanvasRenderer, SVGFont } from 'js-font-parser';

const font = await FontParser.load('./font.ttf');
const glyph = font.getGlyphByChar('A');
const svg = SVGFont.exportStringSvg(font, 'Hello');
```

### Browser Script Tag

```html
<script src="./dist-build/fontparser.min.js"></script>
<script>
  const { FontParser } = window.FontParser;
</script>
```

## Format Support

- TTF: supported
- OTF/CFF: supported
- WOFF: supported
- WOFF2: supported when a decoder is provided at runtime

WOFF2 decoder hook:
- `setWoff2Decoder(...)`, or
- global `WOFF2.decode(...)`

See: `tools/woff2.html`

## Current Known Gaps

Current top open items are tracked in `docs/WISHLIST.md`:
- golden image CI enforcement
- final GPOS sign-off across more real-script fixtures
- default WOFF2 runtime packaging strategy

## API by Task

- Load/parse:
  - `FontParser.load(url)`
  - `FontParser.fromArrayBuffer(buffer)`
- Glyph access:
  - `getGlyph(index)`
  - `getGlyphByChar(char)`
  - `getGlyphIndexByChar(char)`
- Layout/shaping:
  - `layoutString(...)`
  - `layoutStringAuto(...)`
  - GSUB/GPOS paths via parser/layout options
- Metrics/metadata:
  - `getUnitsPerEm()`, `getAscent()`, `getDescent()`
  - metadata convenience API (`name`, `OS/2`, `post`)
- Rendering helpers:
  - `CanvasRenderer`
  - `SVGFont`

Full API details: `docs/API.md`

## Demos and Tools

- Demos index: `demos/index.html` (creative showcases)
- Tools index: `tools/index.html` (inspection/debug workflows)

Examples:
- `demos/glyph-playground.html`: deformable interactive glyph physics
- `demos/path-runner.html`: path traversal + node pausing
- `tools/metadata.html`: metadata inspection
- `tools/unicode-coverage.html`: block coverage inspection
- `tools/font-diff.html`: font diffing workflow

## Diagnostics and Error Handling

- Parser and helpers expose structured diagnostics for fallback/unsupported/error paths.
- Repeated diagnostics are deduplicated where appropriate.
- For WOFF2, missing decoder is a controlled runtime error, not silent corruption.

## Performance Notes

- Use cached font instances (`FontParser.load`) for repeated operations.
- Prefer sampling/stride controls in heavy point-based visual demos.
- For large animated point sets, use spatial partitioning or capped neighbor checks.

## Development Workflow

Node version:
- `.nvmrc` and `package.json` engines currently target Node `>=22 <24`.

Important TS import note:
- Source intentionally keeps `.js` import specifiers in TS files for runtime module resolution after compile.

## Scripts

- `npm run build`: build `dist/` and `dist-build/fontparser.min.js`
- `npm run build:dist`: compile TS to `dist/`
- `npm run build:bundle`: webpack UMD bundle
- `npm test`: fast default suite
- `npm run test:full`: full fixture sweep
- `npm run test:coverage`: coverage report
- `npm run test:perf`: perf report
- `npm run test:perf:enforce`: perf budget gate
- `npm run test:golden:capture`: capture visual baseline candidate
- `npm run test:golden:compare`: compare baseline vs current
- `npm run test:golden:between -- --base <sha> --head <sha>`: visual compare between commits

## Package Contract

- Supported npm entrypoint: `import { ... } from 'js-font-parser'`
- Do not deep-import `dist/...` internals from npm consumers.
- Browser demos in this repo use `dist-build/fontparser.min.js` intentionally.

## Project Docs

- `docs/API.md`
- `docs/WISHLIST.md`
- `proj/fontparser/README.md` (CLI)
- `tests/golden/README.md`
