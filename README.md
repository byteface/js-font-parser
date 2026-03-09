# JS Font Parser

Parses TTF/OTF/WOFF fonts and exposes glyph geometry, tables, shaping helpers, metadata, and rendering utilities for demos/tools.

## Quick Start

```bash
nvm use
npm install
npm run build:dist
python3 -m http.server 8080
```

Open:
- `http://localhost:8080`

## Scripts

- `npm test`  
  Run the checked-in `tests/*.test.mjs` suite with Node's built-in test runner.
- `npm run test:coverage`  
  Run tests with coverage output (`--experimental-test-coverage`).
- `npm run test:golden:capture`  
  Capture visual snapshots for key demo/tool pages.
- `npm run test:golden:compare`  
  Diff baseline vs current snapshots (fails on changes).
- `npm run test:golden:approve`  
  Replace baseline snapshots with reviewed current captures.
- `npm run test:golden:between -- --base <sha> --head <sha>`  
  Compare screenshots produced from two commits.
- `npm run build:dist`  
  Compile TypeScript to `dist/`.
- `npm run build:bundle`  
  Build bundle output via webpack.
- `npm run build`  
  Run both `build:dist` and `build:bundle`.

## Running Demos and Tools

Pages must be served over HTTP (not opened via `file://`).

```bash
python3 -m http.server 8080
```

Demo pages can reuse shared wiring in `demos/shared/` (for example `demo-scaffold.js` for font picker population and cached async font loading) to keep UI glue out of parser core.

## WOFF2 Support

WOFF2 decoding requires a decoder in runtime. Provide one via:
- `setWoff2Decoder()` from `src/utils/Woff2Decoder.ts`, or
- global `WOFF2.decode()`.

The WOFF2 smoke page is `tools/woff2.html`.

## Important Note About TS Imports

TypeScript source intentionally uses `.js` import extensions so browser-loaded compiled output resolves correctly.  
Removing those extensions may compile but break runtime module resolution in demos/tools.

## Node Version

Use the pinned version in `.nvmrc` (`22`).

## API and Docs

- `docs/API.md`
- `docs/WISHLIST.md`
- `proj/fontparser/README.md` (CLI)
- `tests/golden/README.md`

Use `docs/WISHLIST.md` as the single source of truth for:
- desired core features
- known limitations
- remaining work and close-out criteria

## Bundle Output

`npm run build` writes bundled output to:
- `dist-build/fontparser.min.js`
