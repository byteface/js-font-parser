import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { FeatureList } from "./FeatureList.js";
import { ILookupSubtableFactory } from "./ILookupSubtableFactory.js";
import { ITable } from "./ITable.js";
import { LookupList } from "./LookupList.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { ScriptList } from "./ScriptList.js";
import { Table } from "./Table.js";

export class GposTable implements ITable, ILookupSubtableFactory {
    scriptList: ScriptList;
    featureList: FeatureList;
    lookupList: LookupList;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;

        byte_ar.readInt();
        const scriptListOffset = byte_ar.readUnsignedShort();
        const featureListOffset = byte_ar.readUnsignedShort();
        const lookupListOffset = byte_ar.readUnsignedShort();

        this.scriptList = new ScriptList(byte_ar, de.offset + scriptListOffset);
        this.featureList = new FeatureList(byte_ar, de.offset + featureListOffset);
        this.lookupList = new LookupList(byte_ar, de.offset + lookupListOffset, this);
    }

    public read(_type: number, _byte_ar: ByteArray, _offset: number): LookupSubtable | null {
        return null;
    }

    public getType(): number {
        return Table.GPOS;
    }
}
