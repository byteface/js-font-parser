import { Table } from "./Table.js";
import { ScriptList } from "./ScriptList.js";
import { FeatureList } from "./FeatureList.js";
import { LookupList } from "./LookupList.js";
import { SingleSubst } from "./SingleSubst.js";
import { LigatureSubst } from "./LigatureSubst.js";
import { LigatureSubstFormat1 } from "./LigatureSubstFormat1.js";
import { ContextSubst } from "./ContextSubst.js";
import { ChainingSubst } from "./ChainingSubst.js";
var GsubTable = /** @class */ (function () {
    function GsubTable(de, byte_ar) {
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
                // s = MultipleSubst.read(byte_ar, offset);
                break;
            case 3:
                // s = AlternateSubst.read(byte_ar, offset);
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
        var _a;
        var lookup = (_a = this.lookupList) === null || _a === void 0 ? void 0 : _a.getLookups()[lookupIndex];
        if (!lookup)
            return glyphs;
        var out = glyphs.slice();
        for (var s = 0; s < lookup.getSubtableCount(); s++) {
            var st = lookup.getSubtable(s);
            if (!st)
                continue;
            if (index < 0 || index >= out.length)
                continue;
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
        if (!script)
            return null;
        return script.getDefaultLangSys();
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
    GsubTable.prototype.getType = function () {
        return Table.GSUB;
    };
    return GsubTable;
}());
export { GsubTable };
