import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { FeatureList } from "./FeatureList.js";
import { ILookupSubtableFactory } from "./ILookupSubtableFactory.js";
import { ITable } from "./ITable.js";
import { LookupList } from "./LookupList.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { ScriptList } from "./ScriptList.js";
import { Table } from "./Table.js";
import { MarkBasePosFormat1 } from "./MarkBasePosFormat1.js";
import { PairPosSubtable } from "./PairPosSubtable.js";
import { CursivePosFormat1 } from "./CursivePosFormat1.js";
import { MarkLigPosFormat1 } from "./MarkLigPosFormat1.js";
import { MarkMarkPosFormat1 } from "./MarkMarkPosFormat1.js";

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
        if (_type === 2) return PairPosSubtable.read(_byte_ar, _offset);
        if (_type === 3) return new CursivePosFormat1(_byte_ar, _offset);
        if (_type === 4) return new MarkBasePosFormat1(_byte_ar, _offset);
        if (_type === 5) return new MarkLigPosFormat1(_byte_ar, _offset);
        if (_type === 6) return new MarkMarkPosFormat1(_byte_ar, _offset);
        return null;
    }

    public getType(): number {
        return Table.GPOS;
    }
}
