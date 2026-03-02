# JS Font Parser

This library can load truetype fonts for creative experiments.

It obtains the glyph points allowing a user to draw the shapes on the canvas.

## Usage

### Run The Demos (raw JS in `dist/`)
The demos use the prebuilt files in `dist/` and **must** be served over HTTP.

```bash
cd /Users/byteface/Desktop/projects/js-font-parser
python3 -m http.server 8080
```

Then open:
`http://localhost:8080/index.html`

Demo pages (see `demos/index.html`):
- `demos/string.html` (string rendering)
- `demos/multilang.html` (multilingual samples)
- `demos/metrics.html` (metrics + rulers)
- `demos/gsub.html` (ligature substitution)
- `demos/kerning.html`
- `demos/particle.html` (ported style)
- `demos/3dglasses.html`
- `demos/shadow.html`
- `demos/stack.html`
- `demos/svg-export.html` (export string to SVG)
- `demos/path-tracing.html` (SVG stroke tracing)
- `demos/morphing.html` (glyph morphing)
- `demos/breathing.html` (organic motion)
- `demos/emotion.html` (breathing/melting/angry)
- `demos/color-font.html` (COLR/CPAL table inspection)
- `demos/font-library.html` (CDN font loader)
- `demos/all-glyphs.html` (render every glyph)
- `demos/ribbon.html` (glyph ribbon motion)
- `demos/particle-word.html` (particle assemble/explode)
- `demos/orbit.html` (orbiting glyphs)
- `demos/woff.html`
- `demos/metadata.html`
- `demos/features.html` (GSUB/GPOS tags)
- `demos/tables.html` (table overview)

### Noto Fonts
The `truetypefonts/noto/` folder contains a small set of Noto fonts (SIL OFL) for multilingual demos.

### Color Fonts
The `truetypefonts/color/` folder includes `TwemojiMozilla.ttf` (COLR/CPAL). See `truetypefonts/color/README.md` for attribution and licenses.

## Tests
```sh
npm test
```

Tests use Node's built-in test runner and the prebuilt `dist/` outputs.

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

Then you can use it like so...

TODO -

### TypeScript Usage (string rendering)
This uses the TypeScript sources (compiled to `dist/` in this repo).

```js
import { FontParserTTF } from "./dist/data/FontParserTTF.js";

FontParserTTF.load("truetypefonts/DiscoMo.ttf").then((font) => {
  const glyph = font.getGlyphByChar("H");
  const indices = font.getGlyphIndicesForString("hello world");
  console.log(glyph, indices);
});
```


### To Include only what you need

This requires a deeper understanding of the library

### Docs
- `docs/API.md`
- `docs/PORTING.md`
- `docs/WISHLIST.md`
- `docs/DEMO_NOTES.md`





# dev notes

## // UNTESTED

This was ported over years through many languages. java > as3 > vannila js > typescript.

In this time things have changed in the font word. i.e. more cmap formats and also not all tables
were ported in the move to vanilla js as weren't deemed required at the time for what i used it for.

Now with the help of GPT these things don't take weeks but just hours so it doesn't make sense not to port some things that were missedin the past as its trivial. However there's not tests or useages for some of these things atm. so if the .ts file has '// UNTESTED' comment at the top, then it has no current usesage examples or requirements yet within the repo. Hopefully these will come in time or prove useful later to someone.
