export class CmapFormat2 {
    subHeaderKeys;
    subHeaders; // Define a specific type for subHeaders if available
    glyphIndexArray;
    format;
    length;
    version;
    constructor(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.format = 2;
        // Parse subHeaderKeys
        this.subHeaderKeys = [];
        for (let i = 0; i < 256; i++) {
            this.subHeaderKeys[i] = byteArray.readUnsignedShort();
        }
        // Parse subHeaders based on the keys
        this.subHeaders = [];
        for (let i = 0; i < this.subHeaderKeys.length; i++) {
            if (this.subHeaderKeys[i] !== 0) {
                this.subHeaders.push(this.parseSubHeader(byteArray));
            }
        }
        // Parse glyphIndexArray, based on subHeader data
        this.glyphIndexArray = [];
        for (let i = 0; i < this.length - byteArray.offset; i++) {
            this.glyphIndexArray.push(byteArray.readUnsignedShort());
        }
    }
    parseSubHeader(byteArray) {
        // Define parsing logic based on the specific structure of subHeaders.
        return {
            firstCode: byteArray.readUnsignedShort(),
            entryCount: byteArray.readUnsignedShort(),
            idDelta: byteArray.readShort(),
            idRangeOffset: byteArray.readUnsignedShort(),
        };
    }
    getFormatType() {
        return this.format;
    }
    getGlyphIndex(codePoint) {
        const subHeaderIndex = this.subHeaderKeys[codePoint >> 8];
        const subHeader = this.subHeaders[subHeaderIndex];
        if (!subHeader) {
            return null;
        }
        const lowByte = codePoint & 0xFF;
        const glyphIndexOffset = subHeader.idRangeOffset / 2 + (lowByte - subHeader.firstCode);
        if (lowByte < subHeader.firstCode || lowByte >= subHeader.firstCode + subHeader.entryCount) {
            return null;
        }
        const glyphIndex = this.glyphIndexArray[glyphIndexOffset];
        return glyphIndex === 0 ? null : (glyphIndex + subHeader.idDelta) % 65536;
    }
    getFirst() {
        return Math.min(...this.subHeaderKeys);
    }
    getLast() {
        return Math.max(...this.subHeaderKeys);
    }
    mapCharCode(charCode) {
        const glyphIndex = this.getGlyphIndex(charCode);
        return glyphIndex ?? 0;
    }
    toString() {
        return `format: ${this.format}, length: ${this.length}, version: ${this.version}`;
    }
}
