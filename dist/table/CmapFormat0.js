export class CmapFormat0 {
    glyphIdArray;
    first;
    last;
    format;
    length;
    version;
    constructor(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 0;
        this.first = -1;
        this.last = -1; // Initialize last to -1
        this.glyphIdArray = new Array(256); // Initialize the array
        for (let i = 0; i < 256; i++) {
            this.glyphIdArray[i] = byteArray.readByte();
            if (this.glyphIdArray[i] > 0) {
                if (this.first === -1)
                    this.first = i;
                this.last = i;
            }
        }
    }
    getFirst() {
        return this.first;
    }
    getLast() {
        return this.last;
    }
    mapCharCode(charCode) {
        if (0 <= charCode && charCode < 256) {
            return this.glyphIdArray[charCode];
        }
        else {
            return 0;
        }
    }
    // Method to get the format type (always returns 0 for CmapFormat0)
    getFormatType() {
        return this.format;
    }
    // Method to get the glyph index for a given code point
    getGlyphIndex(codePoint) {
        if (codePoint >= 0 && codePoint < this.glyphIdArray.length) {
            return this.glyphIdArray[codePoint];
        }
        return null;
    }
    toString() {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}`;
    }
}
