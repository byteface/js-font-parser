import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ScriptList } from "./ScriptList.js";
import { ITable } from "./ITable.js";
import { FeatureList } from "./FeatureList.js";
import { LookupList } from "./LookupList.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { Script } from "./Script.js";
import { LangSys } from "./LangSys.js";
export declare class GsubTable implements ITable {
    private static readonly FEATURE_ORDER_CACHE_LIMIT;
    private static readonly APPLY_FEATURES_CACHE_LIMIT;
    scriptList: ScriptList;
    featureList: FeatureList;
    lookupList: LookupList;
    private gdef;
    private featureOrderCache;
    private applyFeaturesCache;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    setGdef(gdef: any | null): void;
    /**
     * 1 - Single - Replace one glyph with one glyph
     * 2 - Multiple - Replace one glyph with more than one glyph
     * 3 - Alternate - Replace one glyph with one of many glyphs
     * 4 - Ligature - Replace multiple glyphs with one glyph
     * 5 - Context - Replace one or more glyphs in context
     * 6 - Chaining - Context Replace one or more glyphs in chained context
     */
    read(type: number, byte_ar: ByteArray, offset: number): LookupSubtable | null;
    applyLookupAt(lookupIndex: number, glyphs: number[], index: number): number[];
    getScriptList(): ScriptList;
    getFeatureList(): FeatureList;
    getLookupList(): LookupList;
    findPreferredScript(tags?: string[]): Script | null;
    getDefaultLangSys(script: Script | null): LangSys | null;
    getSubtablesForFeatures(featureTags: string[], scriptTags?: string[]): LookupSubtable[];
    applyFeatures(glyphs: number[], featureTags: string[], scriptTags?: string[]): number[];
    private applyLookup;
    private hasIgnoreFlags;
    private isGlyphIgnored;
    private tagToString;
    private getFeatureOrder;
    private getApplyFeaturesCacheKey;
    private cacheAppliedFeatures;
    private setBoundedCacheEntry;
    getType(): number;
}
