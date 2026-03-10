export class CmapFormat6 {
    format;
    length;
    version;
    firstCode;
    entryCount;
    glyphIdArray;
    constructor(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 6;
        this.firstCode = byteArray.readUnsignedShort(); // Read firstCode from the ByteArray
        this.entryCount = byteArray.readUnsignedShort(); // Read entryCount from the ByteArray
        this.glyphIdArray = [];
        // Populate glyphIdArray with the glyph IDs
        for (let i = 0; i < this.entryCount; i++) {
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
    }
    getFirst() {
        return this.firstCode; // Return the first character code
    }
    getFormatType() {
        return this.format;
    }
    getGlyphIndex(codePoint) {
        const value = this.mapCharCode(codePoint);
        return value === 0 ? null : value;
    }
    getLast() {
        // Calculate the last code based on firstCode and entryCount
        return this.firstCode + this.entryCount - 1;
    }
    mapCharCode(charCode) {
        // Check if charCode falls within the range of firstCode and lastCode
        if (charCode < this.firstCode || charCode > this.getLast()) {
            return 0; // Out of bounds
        }
        // Calculate index in glyphIdArray
        const index = charCode - this.firstCode;
        return this.glyphIdArray[index] || 0; // Return glyph ID or 0 if not found
    }
    toString() {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}, ` +
            `firstCode: ${this.firstCode}, entryCount: ${this.entryCount}, ` +
            `glyphIdArray: ${this.glyphIdArray}`;
    }
}
