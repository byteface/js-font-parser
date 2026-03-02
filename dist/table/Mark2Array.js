import { Anchor } from './Anchor.js';
var Mark2Array = /** @class */ (function () {
    function Mark2Array(byte_ar, offset, markClassCount) {
        this.records = [];
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.mark2Count = byte_ar.readUnsignedShort();
        var anchorOffsets = [];
        for (var i = 0; i < this.mark2Count; i++) {
            var offsets = [];
            for (var j = 0; j < markClassCount; j++) {
                offsets.push(byte_ar.readUnsignedShort());
            }
            anchorOffsets.push(offsets);
        }
        this.records = anchorOffsets.map(function (list) { return ({
            anchors: list.map(function (o) { return Anchor.read(byte_ar, offset + o); })
        }); });
        byte_ar.offset = prev;
    }
    return Mark2Array;
}());
export { Mark2Array };
