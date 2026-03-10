import { FeatureList } from "./FeatureList.js";
import { LookupList } from "./LookupList.js";
import { ScriptList } from "./ScriptList.js";
import { Table } from "./Table.js";
import { MarkBasePosFormat1 } from "./MarkBasePosFormat1.js";
import { PairPosSubtable } from "./PairPosSubtable.js";
import { CursivePosFormat1 } from "./CursivePosFormat1.js";
import { MarkLigPosFormat1 } from "./MarkLigPosFormat1.js";
import { MarkMarkPosFormat1 } from "./MarkMarkPosFormat1.js";
import { SinglePosSubtable } from "./SinglePosSubtable.js";
var GposTable = /** @class */ (function () {
    function GposTable(de, byte_ar) {
        byte_ar.offset = de.offset;
        byte_ar.readInt();
        var scriptListOffset = byte_ar.readUnsignedShort();
        var featureListOffset = byte_ar.readUnsignedShort();
        var lookupListOffset = byte_ar.readUnsignedShort();
        this.scriptList = new ScriptList(byte_ar, de.offset + scriptListOffset);
        this.featureList = new FeatureList(byte_ar, de.offset + featureListOffset);
        this.lookupList = new LookupList(byte_ar, de.offset + lookupListOffset, this);
        this.subtableCache = new Map();
    }
    GposTable.prototype.read = function (_type, _byte_ar, _offset) {
        if (_type === 1)
            return SinglePosSubtable.read(_byte_ar, _offset);
        if (_type === 2)
            return PairPosSubtable.read(_byte_ar, _offset);
        if (_type === 3)
            return new CursivePosFormat1(_byte_ar, _offset);
        if (_type === 4)
            return new MarkBasePosFormat1(_byte_ar, _offset);
        if (_type === 5)
            return new MarkLigPosFormat1(_byte_ar, _offset);
        if (_type === 6)
            return new MarkMarkPosFormat1(_byte_ar, _offset);
        return null;
    };
    GposTable.prototype.findPreferredScript = function (tags) {
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
    GposTable.prototype.getDefaultLangSys = function (script) {
        var _a;
        if (!script)
            return null;
        return (_a = script.getDefaultLangSys()) !== null && _a !== void 0 ? _a : script.getFirstLangSys();
    };
    GposTable.prototype.getSubtablesForFeatures = function (featureTags, scriptTags) {
        if (scriptTags === void 0) { scriptTags = ["DFLT", "latn"]; }
        if (!this.subtableCache) {
            this.subtableCache = new Map();
        }
        var cacheKey = "".concat(scriptTags.join(","), "::").concat(featureTags.join(","));
        var cached = this.subtableCache.get(cacheKey);
        if (cached)
            return cached;
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
        this.subtableCache.set(cacheKey, subtables);
        return subtables;
    };
    GposTable.prototype.getType = function () {
        return Table.GPOS;
    };
    return GposTable;
}());
export { GposTable };
