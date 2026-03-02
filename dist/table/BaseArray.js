import { Anchor } from './Anchor.js';
var BaseArray = /** @class */ (function () {
    function BaseArray(byte_ar, offset, markClassCount) {
        this.baseRecords = [];
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.baseCount = byte_ar.readUnsignedShort();
        var anchorOffsets = [];
        for (var i = 0; i < this.baseCount; i++) {
            var offsets = [];
            for (var j = 0; j < markClassCount; j++) {
                offsets.push(byte_ar.readUnsignedShort());
            }
            anchorOffsets.push(offsets);
        }
        this.baseRecords = anchorOffsets.map(function (list) { return ({
            anchors: list.map(function (o) { return Anchor.read(byte_ar, offset + o); })
        }); });
        byte_ar.offset = prev;
    }
    return BaseArray;
}());
export { BaseArray };
