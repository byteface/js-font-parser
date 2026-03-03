# JS Font Parser

This library parses TrueType fonts. It obtains the glyph points allowing a user to draw shapes on the canvas.

## Usage

### Build the Dist Outputs
The demos import from `dist/`, so you need to compile the TypeScript before running them:

```bash
cd /Users/byteface/Desktop/projects/js-font-parser
npm run build:dist
```

### Run the Demos (raw JS in `dist/`)
The demos **must** be served over HTTP.

```bash
cd /Users/byteface/Desktop/projects/js-font-parser
python3 -m http.server 8080
```

Open:
`http://localhost:8080/demos/index.html`

### Language Support Demo
`demos/language-support.html` checks glyph coverage for a list of languages.

### Important: Keep `.js` in TS Imports
TypeScript source files intentionally import with `.js` extensions (for example `../dist/.../Foo.js`).
This ensures the compiled output works in the browser without bundlers.  
If you remove those `.js` extensions, `tsc` might pass, but the demos will break in the browser.

## Tests
```sh
npm test
```

## Minified Build
```sh
npm run build
```

Output is written to `dist-build/fontparser.min.js`. See `minifyTest.html` for a simple usage example.
Arabic/Devanagari shaping is not implemented yet, so those scripts will render unshaped outlines.

### Include The Bundled Library
Build a UMD bundle and include it in your HTML file:

```bash
npm install
npm run build
```

Build output: `dist-build/fontparser.min.js`

Then include the bundled library in your HTML file:

```html
<script src="fontparser.min.js"></script>
```

```js
import { FontParserTTF } from "./dist/data/FontParserTTF.js";

FontParserTTF.load("truetypefonts/DiscoMo.ttf").then((font) => {
  const glyph = font.getGlyphByChar("H");
  const indices = font.getGlyphIndicesForString("hello world");
  console.log(glyph, indices);
});
```

### CLI (prototype)
```bash
npm run build:dist
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --coverage
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --localise es --out /tmp/DiscoMo-es.ttf
```


### Docs
- `docs/API.md`
- `docs/PORTING.md`
- `docs/WISHLIST.md`
- `docs/DEMO_NOTES.md`
