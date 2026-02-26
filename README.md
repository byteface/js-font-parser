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
- `demos/grid.html` (glyph index grid)
- `demos/multilang.html` (multilingual samples)
- `demos/layout-chars.html` (ported)
- `demos/cards.html` (ported)
- `demos/particle.html` (ported style)

### Noto Fonts
The `truetypefonts/noto/` folder contains a small set of Noto fonts (SIL OFL) for multilingual demos.
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





# dev notes

## // UNTESTED

This was ported over years through many languages. java > as3 > vannila js > typescript.

In this time things have changed in the font word. i.e. more cmap formats and also not all tables
were ported in the move to vanilla js as weren't deemed required at the time for what i used it for.

Now with the help of GPT these things don't take weeks but just hours so it doesn't make sense not to port some things that were missedin the past as its trivial. However there's not tests or useages for some of these things atm. so if the .ts file has '// UNTESTED' comment at the top, then it has no current usesage examples or requirements yet within the repo. Hopefully these will come in time or prove useful later to someone.
