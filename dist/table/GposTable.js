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
    GposTable.prototype.getType = function () {
        return Table.GPOS;
    };
    return GposTable;
}());
export { GposTable };
