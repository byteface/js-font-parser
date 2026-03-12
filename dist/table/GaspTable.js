import { Table } from "./Table.js";
export class GaspTable {
    version;
    numRanges;
    ranges;
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.numRanges = byte_ar.readUnsignedShort();
        this.ranges = [];
        for (let i = 0; i < this.numRanges; i++) {
            this.ranges.push({
                rangeMaxPPEM: byte_ar.readUnsignedShort(),
                rangeGaspBehavior: byte_ar.readUnsignedShort()
            });
        }
    }
    getType() {
        return Table.gasp;
    }
}
