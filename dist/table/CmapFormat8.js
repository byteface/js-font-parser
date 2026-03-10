export class CmapFormat8 {
    format;
    length;
    version;
    glyphIdArray;
    characterCodes;
    constructor(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 8;
        // Read the number of character codes
        const numCodes = byteArray.readUnsignedShort();
        this.characterCodes = [];
        this.glyphIdArray = [];
        // Read character codes and corresponding glyph IDs
        for (let i = 0; i < numCodes; i++) {
            this.characterCodes.push(byteArray.readUnsignedShort());
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
    }
    getFormatType() {
        return this.format; // Return the format type
    }
    getGlyphIndex(charCode) {
        // Use binary search or linear search to find the character code
        const index = this.characterCodes.indexOf(charCode);
        return index !== -1 ? this.glyphIdArray[index] : 0; // Return corresponding glyph ID or 0 if not found
    }
    getFirst() {
        return this.characterCodes.length > 0 ? this.characterCodes[0] : 0; // Return the first character code
    }
    getLast() {
        return this.characterCodes.length > 0 ? this.characterCodes[this.characterCodes.length - 1] : 0; // Return the last character code
    }
    mapCharCode(charCode) {
        return this.getGlyphIndex(charCode); // Use getGlyphIndex for mapping
    }
    toString() {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}, ` +
            `characterCodes: ${this.characterCodes}, glyphIdArray: ${this.glyphIdArray}`;
    }
}
