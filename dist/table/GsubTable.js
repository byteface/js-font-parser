import { Table } from "./Table.js";
import { ScriptList } from "./ScriptList.js";
import { FeatureList } from "./FeatureList.js";
import { LookupList } from "./LookupList.js";
import { SingleSubst } from "./SingleSubst.js";
import { LigatureSubst } from "./LigatureSubst.js";
import { ContextSubst } from "./ContextSubst.js";
import { ChainingSubst } from "./ChainingSubst.js";
import { LigatureSubstFormat1 } from "./LigatureSubstFormat1.js";
import { MultipleSubst } from "./MultipleSubst.js";
import { AlternateSubst } from "./AlternateSubst.js";
import { ReverseChainSingleSubst } from "./ReverseChainSingleSubst.js";
export class GsubTable {
    static FEATURE_ORDER_CACHE_LIMIT = 128;
    static APPLY_FEATURES_CACHE_LIMIT = 128;
    scriptList;
    featureList;
    lookupList;
    gdef = null;
    featureOrderCache = new Map();
    applyFeaturesCache = new Map();
    constructor(de, byte_ar) {
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
    setGdef(gdef) {
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
    read(type, byte_ar, offset) {
        let s = null;
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
            case 8:
                s = new ReverseChainSingleSubst(byte_ar, offset);
                break;
        }
        return s;
    }
    applyLookupAt(lookupIndex, glyphs, index) {
        const lookup = this.lookupList?.getLookups?.()[lookupIndex];
        if (!lookup)
            return glyphs;
        const out = glyphs.slice();
        for (let s = 0; s < lookup.getSubtableCount(); s++) {
            const st = lookup.getSubtable(s);
            if (!st)
                continue;
            if (index < 0 || index >= out.length)
                continue;
            if (this.isGlyphIgnored(lookup, out[index]))
                continue;
            if (typeof st.applyAt === "function") {
                const nextGlyphs = st.applyAt(out, index);
                if (nextGlyphs)
                    return nextGlyphs;
            }
            if (typeof st.substitute === "function") {
                const original = out[index];
                const next = st.substitute(original);
                if (next != null && next !== original) {
                    out[index] = next;
                    return out;
                }
            }
            if (st instanceof LigatureSubstFormat1) {
                const lig = st;
                const match = lig.tryLigature(out, index);
                if (match) {
                    const replaced = out.slice(0, index).concat([match.glyphId], out.slice(index + match.length));
                    return replaced;
                }
            }
        }
        return out;
    }
    getScriptList() {
        return this.scriptList;
    }
    getFeatureList() {
        return this.featureList;
    }
    getLookupList() {
        return this.lookupList;
    }
    findPreferredScript(tags = ["DFLT", "latn"]) {
        for (const tag of tags) {
            const script = this.scriptList.findScript(tag);
            if (script)
                return script;
        }
        const records = this.scriptList.getScriptRecords();
        if (records.length > 0) {
            const fallbackTag = String.fromCharCode((records[0].tag >> 24) & 0xff, (records[0].tag >> 16) & 0xff, (records[0].tag >> 8) & 0xff, records[0].tag & 0xff);
            return this.scriptList.findScript(fallbackTag);
        }
        return null;
    }
    getDefaultLangSys(script) {
        if (!script)
            return null;
        return script.getDefaultLangSys() ?? script.getFirstLangSys();
    }
    getSubtablesForFeatures(featureTags, scriptTags = ["DFLT", "latn"]) {
        const script = this.findPreferredScript(scriptTags);
        const langSys = this.getDefaultLangSys(script);
        if (!langSys)
            return [];
        const subtables = [];
        for (const tag of featureTags) {
            const feature = this.featureList.findFeature(langSys, tag);
            if (!feature)
                continue;
            for (let i = 0; i < feature.getLookupCount(); i++) {
                const lookup = this.lookupList.getLookup(feature, i);
                if (!lookup)
                    continue;
                for (let j = 0; j < lookup.getSubtableCount(); j++) {
                    const st = lookup.getSubtable(j);
                    if (st)
                        subtables.push(st);
                }
            }
        }
        return subtables;
    }
    applyFeatures(glyphs, featureTags, scriptTags = ["DFLT", "latn"]) {
        const featureOrder = this.getFeatureOrder(featureTags, scriptTags);
        if (!featureOrder || featureOrder.length === 0)
            return glyphs;
        if (!this.applyFeaturesCache) {
            this.applyFeaturesCache = new Map();
        }
        const cacheKey = this.getApplyFeaturesCacheKey(featureOrder, glyphs);
        const cached = this.applyFeaturesCache.get(cacheKey);
        if (cached) {
            return cached.slice();
        }
        let out = glyphs.slice();
        for (const featureIndex of featureOrder) {
            const featureListAny = this.featureList;
            const feature = featureListAny.features?.[featureIndex]
                ?? (typeof featureListAny.getFeatureByIndex === "function"
                    ? featureListAny.getFeatureByIndex(featureIndex)
                    : null);
            if (!feature)
                continue;
            for (let i = 0; i < feature.getLookupCount(); i++) {
                const lookupIndex = feature.getLookupListIndex(i);
                out = this.applyLookup(lookupIndex, out);
            }
        }
        this.cacheAppliedFeatures(cacheKey, out);
        return out;
    }
    applyLookup(lookupIndex, glyphs) {
        const lookup = this.lookupList?.getLookups?.()[lookupIndex];
        if (!lookup)
            return glyphs;
        let out = glyphs.slice();
        for (let s = 0; s < lookup.getSubtableCount(); s++) {
            const st = lookup.getSubtable(s);
            if (!st)
                continue;
            if (typeof st.applyToGlyphsWithContext === "function") {
                out = st.applyToGlyphsWithContext(out, {
                    gdef: this.gdef,
                    lookupFlag: lookup.getFlag?.() ?? 0,
                    markFilteringSet: lookup.getMarkFilteringSet?.() ?? null
                });
                continue;
            }
            if (typeof st.applyToGlyphs === "function") {
                out = st.applyToGlyphs(out);
                continue;
            }
            if (typeof st.substitute === "function") {
                out = out.map(g => {
                    const sub = st.substitute(g);
                    return (sub == null || sub === 0) ? g : sub;
                });
                continue;
            }
            if (st instanceof LigatureSubstFormat1) {
                const lig = st;
                const next = [];
                let i = 0;
                while (i < out.length) {
                    const match = lig.tryLigature(out, i);
                    if (match) {
                        next.push(match.glyphId);
                        i += match.length;
                    }
                    else {
                        next.push(out[i]);
                        i += 1;
                    }
                }
                out = next;
            }
        }
        return out;
    }
    hasIgnoreFlags(lookup) {
        const flag = lookup?.getFlag?.() ?? 0;
        return (flag & 0x0002) !== 0 || (flag & 0x0004) !== 0 || (flag & 0x0008) !== 0;
    }
    isGlyphIgnored(lookup, glyphId) {
        if (!this.gdef)
            return false;
        const flag = lookup?.getFlag?.() ?? 0;
        const glyphClass = this.gdef.getGlyphClass?.(glyphId) ?? 0;
        if ((flag & 0x0002) && glyphClass === 1)
            return true;
        if ((flag & 0x0004) && glyphClass === 2)
            return true;
        if ((flag & 0x0008) && glyphClass === 3)
            return true;
        if ((flag & 0x0010) && glyphClass === 3) {
            const setIndex = lookup?.getMarkFilteringSet?.() ?? 0;
            if (!this.gdef.isGlyphInMarkSet?.(setIndex, glyphId))
                return true;
        }
        const markAttachType = (flag & 0xff00) >> 8;
        if (markAttachType && glyphClass === 3) {
            const cls = this.gdef.getMarkAttachmentClass?.(glyphId) ?? 0;
            if (cls !== markAttachType)
                return true;
        }
        return false;
    }
    tagToString(tag) {
        return String.fromCharCode((tag >> 24) & 0xff, (tag >> 16) & 0xff, (tag >> 8) & 0xff, tag & 0xff);
    }
    getFeatureOrder(featureTags, scriptTags) {
        if (!this.featureOrderCache) {
            this.featureOrderCache = new Map();
        }
        const cacheKey = `${scriptTags.join(",")}::${featureTags.join(",")}`;
        const cached = this.featureOrderCache.get(cacheKey);
        if (cached !== undefined)
            return cached;
        const script = this.findPreferredScript(scriptTags);
        const langSys = this.getDefaultLangSys(script);
        if (!langSys) {
            this.setBoundedCacheEntry(this.featureOrderCache, cacheKey, null, GsubTable.FEATURE_ORDER_CACHE_LIMIT);
            return null;
        }
        const tagSet = new Set(featureTags);
        const featureRecords = this.featureList.getFeatureRecords();
        const requiredIndex = langSys.getRequiredFeatureIndex();
        const orderedFeatureIndices = langSys.getFeatureIndices();
        const featureOrder = [];
        if (requiredIndex != null && requiredIndex !== 0xffff) {
            featureOrder.push(requiredIndex);
        }
        for (const idx of orderedFeatureIndices) {
            if (idx === requiredIndex)
                continue;
            const record = featureRecords[idx];
            if (!record)
                continue;
            const tag = this.tagToString(record.getTag());
            if (!tagSet.has(tag))
                continue;
            featureOrder.push(idx);
        }
        this.setBoundedCacheEntry(this.featureOrderCache, cacheKey, featureOrder, GsubTable.FEATURE_ORDER_CACHE_LIMIT);
        return featureOrder;
    }
    getApplyFeaturesCacheKey(featureOrder, glyphs) {
        return `${featureOrder.join(",")}::${glyphs.join(",")}`;
    }
    cacheAppliedFeatures(cacheKey, glyphs) {
        if (!this.applyFeaturesCache) {
            this.applyFeaturesCache = new Map();
        }
        this.setBoundedCacheEntry(this.applyFeaturesCache, cacheKey, glyphs.slice(), GsubTable.APPLY_FEATURES_CACHE_LIMIT);
    }
    setBoundedCacheEntry(cache, key, value, limit) {
        if (cache.size >= limit && !cache.has(key)) {
            const firstKey = cache.keys().next().value;
            if (firstKey != null) {
                cache.delete(firstKey);
            }
        }
        cache.set(key, value);
    }
    getType() {
        return Table.GSUB;
    }
}
