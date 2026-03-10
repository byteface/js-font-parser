export class CmapFormat12 {
    format;
    length;
    language;
    numGroups;
    groups;
    constructor(byteArray) {
        // Format 12 header: format (uint16), reserved (uint16), length (uint32), language (uint32)
        byteArray.readUnsignedShort(); // reserved
        this.length = byteArray.readUnsignedInt(); // Read length (uint32)
        this.language = byteArray.readUnsignedInt(); // Read language (uint32)
        this.format = 12; // Set format number
        this.numGroups = byteArray.readUnsignedInt(); // Read number of groups
        this.groups = []; // Initialize groups array
        // Read each group
        for (let i = 0; i < this.numGroups; i++) {
            const start = byteArray.readUnsignedInt();
            const end = byteArray.readUnsignedInt();
            const glyphId = byteArray.readUnsignedInt();
            this.groups.push({ start, end, glyphId });
        }
    }
    getFormatType() {
        return this.format;
    }
    getGlyphIndex(charCode) {
        // Iterate through the groups to find the corresponding glyph ID
        for (const group of this.groups) {
            if (charCode >= group.start && charCode <= group.end) {
                return group.glyphId + (charCode - group.start); // Calculate glyph ID
            }
        }
        return 0; // Return 0 if not found
    }
    getFirst() {
        return this.groups.length > 0 ? this.groups[0].start : 0;
    }
    getLast() {
        return this.groups.length > 0 ? this.groups[this.groups.length - 1].end : 0;
    }
    mapCharCode(charCode) {
        return this.getGlyphIndex(charCode);
    }
    toString() {
        return `format: ${this.format}, length: ${this.length}, language: ${this.language}, numGroups: ${this.numGroups}`;
    }
}
