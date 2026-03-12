import { Table } from "./Table.js";
export class LtshTable {
    version;
    numGlyphs;
    yPels;
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.numGlyphs = byte_ar.readUnsignedShort();
        this.yPels = [];
        for (let i = 0; i < this.numGlyphs; i++)
            this.yPels.push(byte_ar.readUnsignedByte());
    }
    getType() {
        return Table.LTSH;
    }
}
