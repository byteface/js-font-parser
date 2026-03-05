// com/byteface/font/utils/Color.ts
var Color = /** @class */ (function () {
    function Color() {
        // set black and white as defaults
        this.range = ['#000000', '#ffffff'];
    }
    // returns a completely random color
    Color.rndColor = function () {
        return '#' + ('00000' + ((Math.random() * 16777216) << 0).toString(16)).slice(-6);
    };
    // returns a random color from the range you set
    Color.prototype.rndColorFromPalette = function () {
        var index = Math.floor(Math.random() * this.range.length);
        return this.range[index];
    };
    Color.prototype.setPalette = function (array) {
        this.range = array;
    };
    Color.clamp01 = function (value) {
        return Math.max(0, Math.min(1, value));
    };
    Color.rgbaToCss = function (r, g, b, a) {
        if (a === void 0) { a = 1; }
        var alpha = Color.clamp01(a);
        return "rgba(".concat(Math.round(r), ", ").concat(Math.round(g), ", ").concat(Math.round(b), ", ").concat(alpha, ")");
    };
    Color.hexToRgba = function (hex) {
        var cleaned = hex.replace('#', '').trim();
        if (![3, 4, 6, 8].includes(cleaned.length))
            return null;
        var expand = function (s) { return s.split('').map(function (ch) { return ch + ch; }).join(''); };
        var normalized = cleaned.length <= 4 ? expand(cleaned) : cleaned;
        var int = parseInt(normalized, 16);
        if (Number.isNaN(int))
            return null;
        var hasAlpha = normalized.length === 8;
        var r = (int >> (hasAlpha ? 24 : 16)) & 0xff;
        var g = (int >> (hasAlpha ? 16 : 8)) & 0xff;
        var b = (int >> (hasAlpha ? 8 : 0)) & 0xff;
        var a = hasAlpha ? (int & 0xff) / 255 : 1;
        return { r: r, g: g, b: b, a: a };
    };
    Color.blend = function (foreground, background) {
        var a = foreground.a + background.a * (1 - foreground.a);
        if (a === 0)
            return { r: 0, g: 0, b: 0, a: 0 };
        var r = (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / a;
        var g = (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / a;
        var b = (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / a;
        return { r: r, g: g, b: b, a: a };
    };
    Color.paletteToCss = function (palette) {
        return palette.map(function (entry) { return Color.rgbaToCss(entry.red, entry.green, entry.blue, entry.alpha / 255); });
    };
    return Color;
}());
export { Color };
