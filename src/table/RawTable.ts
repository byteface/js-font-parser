import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";

export class RawTable implements ITable {
    private readonly type: number;
    private readonly offset: number;
    private readonly length: number;
    private readonly bytes: Uint8Array;

    constructor(type: number, de: DirectoryEntry, byte_ar: ByteArray) {
        this.type = type;
        this.offset = de.offset;
        this.length = de.length;
        const prev = byte_ar.offset;
        byte_ar.offset = de.offset;
        this.bytes = byte_ar.readBytes(de.length).slice();
        byte_ar.offset = prev;
    }

    public getType(): number {
        return this.type;
    }

    public getOffset(): number {
        return this.offset;
    }

    public getLength(): number {
        return this.length;
    }

    public getBytes(): Uint8Array {
        return this.bytes.slice();
    }
}
