// com/byteface/font/utils/Color.ts
export class Color {
    range;
    constructor() {
        // set black and white as defaults
        this.range = ['#000000', '#ffffff'];
    }
    // returns a completely random color
    static rndColor() {
        return '#' + ('00000' + ((Math.random() * 16777216) << 0).toString(16)).slice(-6);
    }
    // returns a random color from the range you set
    rndColorFromPalette() {
        const index = Math.floor(Math.random() * this.range.length);
        return this.range[index];
    }
    setPalette(array) {
        this.range = array;
    }
    static clamp01(value) {
        return Math.max(0, Math.min(1, value));
    }
    static rgbaToCss(r, g, b, a = 1) {
        const alpha = Color.clamp01(a);
        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
    }
    static hexToRgba(hex) {
        const cleaned = hex.replace('#', '').trim();
        if (![3, 4, 6, 8].includes(cleaned.length))
            return null;
        const expand = (s) => s.split('').map(ch => ch + ch).join('');
        const normalized = cleaned.length <= 4 ? expand(cleaned) : cleaned;
        const int = parseInt(normalized, 16);
        if (Number.isNaN(int))
            return null;
        const hasAlpha = normalized.length === 8;
        const r = (int >> (hasAlpha ? 24 : 16)) & 0xff;
        const g = (int >> (hasAlpha ? 16 : 8)) & 0xff;
        const b = (int >> (hasAlpha ? 8 : 0)) & 0xff;
        const a = hasAlpha ? (int & 0xff) / 255 : 1;
        return { r, g, b, a };
    }
    static blend(foreground, background) {
        const a = foreground.a + background.a * (1 - foreground.a);
        if (a === 0)
            return { r: 0, g: 0, b: 0, a: 0 };
        const r = (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / a;
        const g = (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / a;
        const b = (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / a;
        return { r, g, b, a };
    }
    static paletteToCss(palette) {
        return palette.map(entry => Color.rgbaToCss(entry.red, entry.green, entry.blue, entry.alpha / 255));
    }
}
