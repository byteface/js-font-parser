export interface ICmapFormat {
    /**
     * Returns the glyph index for a given Unicode code point.
     * @param codePoint - The Unicode code point to lookup.
     * @returns The glyph index if found, otherwise null.
     */
    getGlyphIndex(codePoint: number): number | null;
    /**
     * Returns the format type (0, 2, 4, 6, etc.) for this cmap format.
     * @returns The format number.
     */
    getFormatType(): number;
    getFirst(): number;
    getLast(): number;
    toString(): string;
}
