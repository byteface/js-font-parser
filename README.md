# JS Font Parser

This library can load truetype fonts for creative experiments.

It obtains the glyph points allowing a user to draw the shapes on the canvas.

## Usage

### To Include the Entire Library
Include the bundled library in your HTML file:

```html
<script src="fontparser.min.js"></script>
```

Then you can use it like so...

TODO -


### To Include only what you need

This requires a deeper understanding of the library





# dev notes

## // UNTESTED

This was ported over years through many languages. java > as3 > vannila js > typescript.

In this time things have changed in the font word. i.e. more cmap formats and also not all tables
were ported in the move to vanilla js as weren't deemed required at the time for what i used it for.

Now with the help of GPT these things don't take weeks but just hours so it doesn't make sense not to port some things that were missedin the past as its trivial. However there's not tests or useages for some of these things atm. so if the .ts file has '// UNTESTED' comment at the top, then it has no current usesage examples or requirements yet within the repo. Hopefully these will come in time or prove useful later to someone.

