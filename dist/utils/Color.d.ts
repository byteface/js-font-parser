export declare class Color {
    private range;
    constructor();
    static rndColor(): string;
    rndColorFromPalette(): string;
    setPalette(array: string[]): void;
    static clamp01(value: number): number;
    static rgbaToCss(r: number, g: number, b: number, a?: number): string;
    static hexToRgba(hex: string): {
        r: number;
        g: number;
        b: number;
        a: number;
    } | null;
    static blend(foreground: {
        r: number;
        g: number;
        b: number;
        a: number;
    }, background: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    static paletteToCss(palette: Array<{
        red: number;
        green: number;
        blue: number;
        alpha: number;
    }>): string[];
}
