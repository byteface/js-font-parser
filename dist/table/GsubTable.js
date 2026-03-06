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
var GsubTable = /** @class */ (function () {
    function GsubTable(de, byte_ar) {
        this.gdef = null;
        byte_ar.offset = de.offset;
        byte_ar.readInt();
        var scriptListOffset = byte_ar.readUnsignedShort();
        var featureListOffset = byte_ar.readUnsignedShort();
        var lookupListOffset = byte_ar.readUnsignedShort();
        // Script List
        this.scriptList = new ScriptList(byte_ar, de.offset + scriptListOffset);
        // Feature List
        this.featureList = new FeatureList(byte_ar, de.offset + featureListOffset);
        // Lookup List
        this.lookupList = new LookupList(byte_ar, de.offset + lookupListOffset, this);
    }
    GsubTable.prototype.setGdef = function (gdef) {
        this.gdef = gdef;
    };
    /**
     * 1 - Single - Replace one glyph with one glyph
     * 2 - Multiple - Replace one glyph with more than one glyph
     * 3 - Alternate - Replace one glyph with one of many glyphs
     * 4 - Ligature - Replace multiple glyphs with one glyph
     * 5 - Context - Replace one or more glyphs in context
     * 6 - Chaining - Context Replace one or more glyphs in chained context
     */
    GsubTable.prototype.read = function (type, byte_ar, offset) {
        var s = null;
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
    };
    GsubTable.prototype.applyLookupAt = function (lookupIndex, glyphs, index) {
        var _a, _b;
        var lookup = (_b = (_a = this.lookupList) === null || _a === void 0 ? void 0 : _a.getLookups) === null || _b === void 0 ? void 0 : _b.call(_a)[lookupIndex];
        if (!lookup)
            return glyphs;
        var out = glyphs.slice();
        for (var s = 0; s < lookup.getSubtableCount(); s++) {
            var st = lookup.getSubtable(s);
            if (!st)
                continue;
            if (index < 0 || index >= out.length)
                continue;
            if (this.isGlyphIgnored(lookup, out[index]))
                continue;
            if (typeof st.applyAt === "function") {
                var nextGlyphs = st.applyAt(out, index);
                if (nextGlyphs)
                    return nextGlyphs;
            }
            if (typeof st.substitute === "function") {
                var original = out[index];
                var next = st.substitute(original);
                if (next != null && next !== original) {
                    out[index] = next;
                    return out;
                }
            }
            if (st instanceof LigatureSubstFormat1) {
                var lig = st;
                var match = lig.tryLigature(out, index);
                if (match) {
                    var replaced = out.slice(0, index).concat([match.glyphId], out.slice(index + match.length));
                    return replaced;
                }
            }
        }
        return out;
    };
    GsubTable.prototype.getScriptList = function () {
        return this.scriptList;
    };
    GsubTable.prototype.getFeatureList = function () {
        return this.featureList;
    };
    GsubTable.prototype.getLookupList = function () {
        return this.lookupList;
    };
    GsubTable.prototype.findPreferredScript = function (tags) {
        if (tags === void 0) { tags = ["DFLT", "latn"]; }
        for (var _i = 0, tags_1 = tags; _i < tags_1.length; _i++) {
            var tag = tags_1[_i];
            var script = this.scriptList.findScript(tag);
            if (script)
                return script;
        }
        var records = this.scriptList.getScriptRecords();
        if (records.length > 0) {
            var fallbackTag = String.fromCharCode((records[0].tag >> 24) & 0xff, (records[0].tag >> 16) & 0xff, (records[0].tag >> 8) & 0xff, records[0].tag & 0xff);
            return this.scriptList.findScript(fallbackTag);
        }
        return null;
    };
    GsubTable.prototype.getDefaultLangSys = function (script) {
        var _a;
        if (!script)
            return null;
        return (_a = script.getDefaultLangSys()) !== null && _a !== void 0 ? _a : script.getFirstLangSys();
    };
    GsubTable.prototype.getSubtablesForFeatures = function (featureTags, scriptTags) {
        if (scriptTags === void 0) { scriptTags = ["DFLT", "latn"]; }
        var script = this.findPreferredScript(scriptTags);
        var langSys = this.getDefaultLangSys(script);
        if (!langSys)
            return [];
        var subtables = [];
        for (var _i = 0, featureTags_1 = featureTags; _i < featureTags_1.length; _i++) {
            var tag = featureTags_1[_i];
            var feature = this.featureList.findFeature(langSys, tag);
            if (!feature)
                continue;
            for (var i = 0; i < feature.getLookupCount(); i++) {
                var lookup = this.lookupList.getLookup(feature, i);
                if (!lookup)
                    continue;
                for (var j = 0; j < lookup.getSubtableCount(); j++) {
                    var st = lookup.getSubtable(j);
                    if (st)
                        subtables.push(st);
                }
            }
        }
        return subtables;
    };
    GsubTable.prototype.applyFeatures = function (glyphs, featureTags, scriptTags) {
        if (scriptTags === void 0) { scriptTags = ["DFLT", "latn"]; }
        var script = this.findPreferredScript(scriptTags);
        var langSys = this.getDefaultLangSys(script);
        if (!langSys)
            return glyphs;
        var tagSet = new Set(featureTags);
        var featureRecords = this.featureList.getFeatureRecords();
        var requiredIndex = langSys.getRequiredFeatureIndex();
        var orderedFeatureIndices = langSys.getFeatureIndices();
        var featureOrder = [];
        if (requiredIndex != null && requiredIndex !== 0xffff) {
            featureOrder.push(requiredIndex);
        }
        for (var _i = 0, orderedFeatureIndices_1 = orderedFeatureIndices; _i < orderedFeatureIndices_1.length; _i++) {
            var idx = orderedFeatureIndices_1[_i];
            if (idx === requiredIndex)
                continue;
            featureOrder.push(idx);
        }
        var out = glyphs.slice();
        for (var _a = 0, featureOrder_1 = featureOrder; _a < featureOrder_1.length; _a++) {
            var featureIndex = featureOrder_1[_a];
            var record = featureRecords[featureIndex];
            if (!record)
                continue;
            var tag = this.tagToString(record.getTag());
            var isRequired = featureIndex === requiredIndex;
            if (!isRequired && !tagSet.has(tag))
                continue;
            var feature = this.featureList.features[featureIndex];
            if (!feature)
                continue;
            for (var i = 0; i < feature.getLookupCount(); i++) {
                var lookupIndex = feature.getLookupListIndex(i);
                out = this.applyLookup(lookupIndex, out);
            }
        }
        return out;
    };
    GsubTable.prototype.applyLookup = function (lookupIndex, glyphs) {
        var _a, _b, _c, _d, _e, _f;
        var lookup = (_b = (_a = this.lookupList) === null || _a === void 0 ? void 0 : _a.getLookups) === null || _b === void 0 ? void 0 : _b.call(_a)[lookupIndex];
        if (!lookup)
            return glyphs;
        var out = glyphs.slice();
        var _loop_1 = function (s) {
            var st = lookup.getSubtable(s);
            if (!st)
                return "continue";
            if (typeof st.applyToGlyphsWithContext === "function") {
                out = st.applyToGlyphsWithContext(out, {
                    gdef: this_1.gdef,
                    lookupFlag: (_d = (_c = lookup.getFlag) === null || _c === void 0 ? void 0 : _c.call(lookup)) !== null && _d !== void 0 ? _d : 0,
                    markFilteringSet: (_f = (_e = lookup.getMarkFilteringSet) === null || _e === void 0 ? void 0 : _e.call(lookup)) !== null && _f !== void 0 ? _f : null
                });
                return "continue";
            }
            if (typeof st.applyToGlyphs === "function") {
                out = st.applyToGlyphs(out);
                return "continue";
            }
            if (typeof st.substitute === "function") {
                out = out.map(function (g) {
                    var sub = st.substitute(g);
                    return (sub == null || sub === 0) ? g : sub;
                });
                return "continue";
            }
            if (st instanceof LigatureSubstFormat1) {
                var lig = st;
                var next = [];
                var i = 0;
                while (i < out.length) {
                    var match = lig.tryLigature(out, i);
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
        };
        var this_1 = this;
        for (var s = 0; s < lookup.getSubtableCount(); s++) {
            _loop_1(s);
        }
        return out;
    };
    GsubTable.prototype.hasIgnoreFlags = function (lookup) {
        var _a, _b;
        var flag = (_b = (_a = lookup === null || lookup === void 0 ? void 0 : lookup.getFlag) === null || _a === void 0 ? void 0 : _a.call(lookup)) !== null && _b !== void 0 ? _b : 0;
        return (flag & 0x0002) !== 0 || (flag & 0x0004) !== 0 || (flag & 0x0008) !== 0;
    };
    GsubTable.prototype.isGlyphIgnored = function (lookup, glyphId) {
        var _a, _b, _c, _d, _e;
        if (!this.gdef)
            return false;
        var flag = (_b = (_a = lookup === null || lookup === void 0 ? void 0 : lookup.getFlag) === null || _a === void 0 ? void 0 : _a.call(lookup)) !== null && _b !== void 0 ? _b : 0;
        var glyphClass = (_e = (_d = (_c = this.gdef).getGlyphClass) === null || _d === void 0 ? void 0 : _d.call(_c, glyphId)) !== null && _e !== void 0 ? _e : 0;
        if ((flag & 0x0002) && glyphClass === 1)
            return true;
        if ((flag & 0x0004) && glyphClass === 2)
            return true;
        if ((flag & 0x0008) && glyphClass === 3)
            return true;
        return false;
    };
    GsubTable.prototype.tagToString = function (tag) {
        return String.fromCharCode((tag >> 24) & 0xff, (tag >> 16) & 0xff, (tag >> 8) & 0xff, tag & 0xff);
    };
    GsubTable.prototype.getType = function () {
        return Table.GSUB;
    };
    return GsubTable;
}());
export { GsubTable };
