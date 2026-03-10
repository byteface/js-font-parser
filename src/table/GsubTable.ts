import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { Table } from "./Table.js";
import { ScriptList } from "./ScriptList.js";
import { ITable } from "./ITable.js";
import { FeatureList } from "./FeatureList.js";
import { LookupList } from "./LookupList.js";
import { SingleSubst } from "./SingleSubst.js";
import { LigatureSubst } from "./LigatureSubst.js";
import { LookupSubtable } from "./LookupSubtable.js";
import { Script } from "./Script.js";
import { LangSys } from "./LangSys.js";
import { ContextSubst } from "./ContextSubst.js";
import { ChainingSubst } from "./ChainingSubst.js";
import { LigatureSubstFormat1 } from "./LigatureSubstFormat1.js";
import { MultipleSubst } from "./MultipleSubst.js";
import { AlternateSubst } from "./AlternateSubst.js";

export class GsubTable implements ITable {
    scriptList: ScriptList;
    featureList: FeatureList;
    lookupList: LookupList;
    private gdef: any | null = null;
    private featureOrderCache = new Map<string, number[] | null>();
    private applyFeaturesCache = new Map<string, number[]>();

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;

        byte_ar.readInt();

        const scriptListOffset = byte_ar.readUnsignedShort();
        const featureListOffset = byte_ar.readUnsignedShort();
        const lookupListOffset = byte_ar.readUnsignedShort();

        // Script List
        this.scriptList = new ScriptList(byte_ar, de.offset + scriptListOffset);

        // Feature List
        this.featureList = new FeatureList(byte_ar, de.offset + featureListOffset);

        // Lookup List
        this.lookupList = new LookupList(byte_ar, de.offset + lookupListOffset, this);
    }

    setGdef(gdef: any | null): void {
        this.gdef = gdef;
    }

    /**
     * 1 - Single - Replace one glyph with one glyph 
     * 2 - Multiple - Replace one glyph with more than one glyph 
     * 3 - Alternate - Replace one glyph with one of many glyphs 
     * 4 - Ligature - Replace multiple glyphs with one glyph 
     * 5 - Context - Replace one or more glyphs in context 
     * 6 - Chaining - Context Replace one or more glyphs in chained context
     */
    read(type: number, byte_ar: ByteArray, offset: number): LookupSubtable | null {
        let s: LookupSubtable | null = null;
        switch (type) {
            case 1:
                s = SingleSubst.read(byte_ar, offset);
                break;
            case 2:
                s = MultipleSubst.read(byte_ar, offset);
                break;
            case 3:
                s = AlternateSubst.read(byte_ar, offset);
                break;
            case 4:
                s = LigatureSubst.read(byte_ar, offset);
                break;
            case 5:
                s = ContextSubst.read(byte_ar, offset, this);
                break;
            case 6:
                s = ChainingSubst.read(byte_ar, offset, this);
                break;
        }
        return s;
    }

    applyLookupAt(lookupIndex: number, glyphs: number[], index: number): number[] {
        const lookup = this.lookupList?.getLookups?.()[lookupIndex];
        if (!lookup) return glyphs;
        let out = glyphs.slice();

        for (let s = 0; s < lookup.getSubtableCount(); s++) {
            const st = lookup.getSubtable(s);
            if (!st) continue;
            if (index < 0 || index >= out.length) continue;
            if (this.isGlyphIgnored(lookup, out[index])) continue;

            if (typeof (st as any).applyAt === "function") {
                const nextGlyphs = (st as any).applyAt(out, index);
                if (nextGlyphs) return nextGlyphs;
            }
            if (typeof (st as any).substitute === "function") {
                const original = out[index];
                const next = (st as any).substitute(original);
                if (next != null && next !== original) {
                    out[index] = next;
                    return out;
                }
            }

            if (st instanceof LigatureSubstFormat1) {
                const lig = st as LigatureSubstFormat1;
                const match = lig.tryLigature(out, index);
                if (match) {
                    const replaced = out.slice(0, index).concat([match.glyphId], out.slice(index + match.length));
                    return replaced;
                }
            }
        }
        return out;
    }

    getScriptList(): ScriptList {
        return this.scriptList;
    }

    getFeatureList(): FeatureList {
        return this.featureList;
    }

    getLookupList(): LookupList {
        return this.lookupList;
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
        return script.getDefaultLangSys() ?? script.getFirstLangSys();
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

    applyFeatures(glyphs: number[], featureTags: string[], scriptTags: string[] = ["DFLT", "latn"]): number[] {
        const featureOrder = this.getFeatureOrder(featureTags, scriptTags);
        if (!featureOrder || featureOrder.length === 0) return glyphs;
        if (!this.applyFeaturesCache) {
            this.applyFeaturesCache = new Map<string, number[]>();
        }
        const cacheKey = this.getApplyFeaturesCacheKey(featureOrder, glyphs);
        const cached = this.applyFeaturesCache.get(cacheKey);
        if (cached) {
            return cached.slice();
        }

        let out = glyphs.slice();
        for (const featureIndex of featureOrder) {
            const featureListAny = this.featureList as any;
            const feature = featureListAny.features?.[featureIndex]
                ?? (typeof featureListAny.getFeatureByIndex === "function"
                    ? featureListAny.getFeatureByIndex(featureIndex)
                    : null);
            if (!feature) continue;
            for (let i = 0; i < feature.getLookupCount(); i++) {
                const lookupIndex = feature.getLookupListIndex(i);
                out = this.applyLookup(lookupIndex, out);
            }
        }
        this.cacheAppliedFeatures(cacheKey, out);
        return out;
    }

    private applyLookup(lookupIndex: number, glyphs: number[]): number[] {
        const lookup = this.lookupList?.getLookups?.()[lookupIndex];
        if (!lookup) return glyphs;
        let out = glyphs.slice();
        for (let s = 0; s < lookup.getSubtableCount(); s++) {
            const st = lookup.getSubtable(s);
            if (!st) continue;
            if (typeof (st as any).applyToGlyphsWithContext === "function") {
                out = (st as any).applyToGlyphsWithContext(out, {
                    gdef: this.gdef,
                    lookupFlag: lookup.getFlag?.() ?? 0,
                    markFilteringSet: lookup.getMarkFilteringSet?.() ?? null
                });
                continue;
            }
            if (typeof (st as any).applyToGlyphs === "function") {
                out = (st as any).applyToGlyphs(out);
                continue;
            }
            if (typeof (st as any).substitute === "function") {
                out = out.map(g => {
                    const sub = (st as any).substitute(g);
                    return (sub == null || sub === 0) ? g : sub;
                });
                continue;
            }
            if (st instanceof LigatureSubstFormat1) {
                const lig = st as LigatureSubstFormat1;
                const next: number[] = [];
                let i = 0;
                while (i < out.length) {
                    const match = lig.tryLigature(out, i);
                    if (match) {
                        next.push(match.glyphId);
                        i += match.length;
                    } else {
                        next.push(out[i]);
                        i += 1;
                    }
                }
                out = next;
            }
        }
        return out;
    }

    private hasIgnoreFlags(lookup: any): boolean {
        const flag = lookup?.getFlag?.() ?? 0;
        return (flag & 0x0002) !== 0 || (flag & 0x0004) !== 0 || (flag & 0x0008) !== 0;
    }

    private isGlyphIgnored(lookup: any, glyphId: number): boolean {
        if (!this.gdef) return false;
        const flag = lookup?.getFlag?.() ?? 0;
        const glyphClass = this.gdef.getGlyphClass?.(glyphId) ?? 0;
        if ((flag & 0x0002) && glyphClass === 1) return true;
        if ((flag & 0x0004) && glyphClass === 2) return true;
        if ((flag & 0x0008) && glyphClass === 3) return true;
        if ((flag & 0x0010) && glyphClass === 3) {
            const setIndex = lookup?.getMarkFilteringSet?.() ?? 0;
            if (!this.gdef.isGlyphInMarkSet?.(setIndex, glyphId)) return true;
        }
        const markAttachType = (flag & 0xff00) >> 8;
        if (markAttachType && glyphClass === 3) {
            const cls = this.gdef.getMarkAttachmentClass?.(glyphId) ?? 0;
            if (cls !== markAttachType) return true;
        }
        return false;
    }

    private tagToString(tag: number): string {
        return String.fromCharCode(
            (tag >> 24) & 0xff,
            (tag >> 16) & 0xff,
            (tag >> 8) & 0xff,
            tag & 0xff
        );
    }

    private getFeatureOrder(featureTags: string[], scriptTags: string[]): number[] | null {
        if (!this.featureOrderCache) {
            this.featureOrderCache = new Map<string, number[] | null>();
        }
        const cacheKey = `${scriptTags.join(",")}::${featureTags.join(",")}`;
        const cached = this.featureOrderCache.get(cacheKey);
        if (cached !== undefined) return cached;

        const script = this.findPreferredScript(scriptTags);
        const langSys = this.getDefaultLangSys(script);
        if (!langSys) {
            this.featureOrderCache.set(cacheKey, null);
            return null;
        }

        const tagSet = new Set(featureTags);
        const featureRecords = this.featureList.getFeatureRecords();
        const requiredIndex = langSys.getRequiredFeatureIndex();
        const orderedFeatureIndices = langSys.getFeatureIndices();
        const featureOrder: number[] = [];

        if (requiredIndex != null && requiredIndex !== 0xffff) {
            featureOrder.push(requiredIndex);
        }
        for (const idx of orderedFeatureIndices) {
            if (idx === requiredIndex) continue;
            const record = featureRecords[idx];
            if (!record) continue;
            const tag = this.tagToString(record.getTag());
            if (!tagSet.has(tag)) continue;
            featureOrder.push(idx);
        }

        this.featureOrderCache.set(cacheKey, featureOrder);
        return featureOrder;
    }

    private getApplyFeaturesCacheKey(featureOrder: number[], glyphs: number[]): string {
        return `${featureOrder.join(",")}::${glyphs.join(",")}`;
    }

    private cacheAppliedFeatures(cacheKey: string, glyphs: number[]): void {
        if (!this.applyFeaturesCache) {
            this.applyFeaturesCache = new Map<string, number[]>();
        }
        if (this.applyFeaturesCache.size >= 128) {
            const firstKey = this.applyFeaturesCache.keys().next().value;
            if (firstKey) {
                this.applyFeaturesCache.delete(firstKey);
            }
        }
        this.applyFeaturesCache.set(cacheKey, glyphs.slice());
    }

    getType(): number {
        return Table.GSUB;
    }
}
