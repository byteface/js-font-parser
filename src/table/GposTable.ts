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
import { SinglePosSubtable } from "./SinglePosSubtable.js";
import { Script } from "./Script.js";
import { LangSys } from "./LangSys.js";

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
        if (_type === 1) return SinglePosSubtable.read(_byte_ar, _offset);
        if (_type === 2) return PairPosSubtable.read(_byte_ar, _offset);
        if (_type === 3) return new CursivePosFormat1(_byte_ar, _offset);
        if (_type === 4) return new MarkBasePosFormat1(_byte_ar, _offset);
        if (_type === 5) return new MarkLigPosFormat1(_byte_ar, _offset);
        if (_type === 6) return new MarkMarkPosFormat1(_byte_ar, _offset);
        return null;
    }

    findPreferredScript(tags: string[] = ["DFLT", "latn"]): Script | null {
        for (const tag of tags) {
            const script = this.scriptList.findScript(tag);
            if (script) return script;
        }
        const records = this.scriptList.getScriptRecords();
        if (records.length > 0) {
            const fallbackTag = String.fromCharCode(
                (records[0].tag >> 24) & 0xff,
                (records[0].tag >> 16) & 0xff,
                (records[0].tag >> 8) & 0xff,
                records[0].tag & 0xff
            );
            return this.scriptList.findScript(fallbackTag);
        }
        return null;
    }

    getDefaultLangSys(script: Script | null): LangSys | null {
        if (!script) return null;
        return script.getDefaultLangSys();
    }

    getSubtablesForFeatures(featureTags: string[], scriptTags: string[] = ["DFLT", "latn"]): LookupSubtable[] {
        const script = this.findPreferredScript(scriptTags);
        const langSys = this.getDefaultLangSys(script);
        if (!langSys) return [];

        const subtables: LookupSubtable[] = [];
        for (const tag of featureTags) {
            const feature = this.featureList.findFeature(langSys, tag);
            if (!feature) continue;
            for (let i = 0; i < feature.getLookupCount(); i++) {
                const lookup = this.lookupList.getLookup(feature, i);
                if (!lookup) continue;
                for (let j = 0; j < lookup.getSubtableCount(); j++) {
                    const st = lookup.getSubtable(j);
                    if (st) subtables.push(st);
                }
            }
        }
        return subtables;
    }

    public getType(): number {
        return Table.GPOS;
    }
}
