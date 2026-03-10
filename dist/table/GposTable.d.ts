import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { FeatureList } from "./FeatureList.js";
import { ILookupSubtableFactory } from "./ILookupSubtableFactory.js";
import { ITable } from "./ITable.js";
import { LookupList } from "./LookupList.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { ScriptList } from "./ScriptList.js";
import { Script } from "./Script.js";
import { LangSys } from "./LangSys.js";
export declare class GposTable implements ITable, ILookupSubtableFactory {
    private static readonly SUBTABLE_CACHE_LIMIT;
    scriptList: ScriptList;
    featureList: FeatureList;
    lookupList: LookupList;
    private subtableCache;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    read(_type: number, _byte_ar: ByteArray, _offset: number): LookupSubtable | null;
    findPreferredScript(tags?: string[]): Script | null;
    getDefaultLangSys(script: Script | null): LangSys | null;
    getSubtablesForFeatures(featureTags: string[], scriptTags?: string[]): LookupSubtable[];
    private setBoundedCacheEntry;
    getType(): number;
}
