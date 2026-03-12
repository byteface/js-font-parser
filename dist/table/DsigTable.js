import { Table } from "./Table.js";
export class DsigTable {
    version;
    numSignatures;
    flags;
    signatures;
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUInt();
        this.numSignatures = byte_ar.readUnsignedShort();
        this.flags = byte_ar.readUnsignedShort();
        this.signatures = [];
        for (let i = 0; i < this.numSignatures; i++) {
            this.signatures.push({
                format: byte_ar.readUnsignedInt(),
                length: byte_ar.readUnsignedInt(),
                offset: byte_ar.readUnsignedInt()
            });
        }
    }
    getType() {
        return Table.DSIG;
    }
}
