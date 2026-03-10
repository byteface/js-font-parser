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
  Run the default fast suite (`tests/*.test.mjs`) with heavy fixture sweeps skipped.
- `npm run test:full`  
  Run the full suite including broad fixture sweeps (`FULL_SWEEP=1`).
- `npm run test:coverage`  
  Run coverage for the default fast suite.
- `npm run test:coverage:full`  
  Run coverage including broad fixture sweeps (`FULL_SWEEP=1`).
- `npm run test:perf`  
  Run the local performance report against representative parse/layout workloads.
- `npm run test:perf:enforce`  
  Run the same performance report, but fail if checked-in budgets regress.
- `npm run test:perf:profile`  
  Run a phase-level hotspot profile for representative parse and layout workloads.
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

## NPM Import Policy

Use a single package entrypoint:

```js
import { FontParser } from 'js-font-parser';
```

- Public npm API is exposed via `package.json` `exports["."]`.
- Do not deep-import internal paths such as `js-font-parser/dist/...`; those are not a supported npm contract.

Use `docs/WISHLIST.md` as the single source of truth for:
- desired core features
- known limitations
- remaining work and close-out criteria

## Bundle Output

`npm run build` writes bundled output to:
- `dist-build/fontparser.min.js`
