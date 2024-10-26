import { Table } from "./Table.js";
import { ScriptList } from "./ScriptList.js";
import { FeatureList } from "./FeatureList.js";
import { LookupList } from "./LookupList.js";
import { SingleSubst } from "./SingleSubst.js";
import { LigatureSubst } from "./LigatureSubst.js";
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
                // s = ContextSubst.read(byte_ar, offset);
                break;
            case 6:
                // s = ChainingSubst.read(byte_ar, offset);
                break;
        }
        return s;
    };
    GsubTable.prototype.getType = function () {
        return Table.GSUB;
    };
    return GsubTable;
}());
export { GsubTable };
