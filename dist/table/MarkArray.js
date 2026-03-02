import { Anchor } from './Anchor.js';
var MarkArray = /** @class */ (function () {
    function MarkArray(byte_ar, offset) {
        this.marks = [];
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.markCount = byte_ar.readUnsignedShort();
        var markClassAndOffsets = [];
        for (var i = 0; i < this.markCount; i++) {
            var markClass = byte_ar.readUnsignedShort();
            var anchorOffset = byte_ar.readUnsignedShort();
            markClassAndOffsets.push({ markClass: markClass, anchorOffset: anchorOffset });
        }
        this.marks = markClassAndOffsets.map(function (entry) { return ({
            markClass: entry.markClass,
            anchor: Anchor.read(byte_ar, offset + entry.anchorOffset)
        }); });
        byte_ar.offset = prev;
    }
    return MarkArray;
}());
export { MarkArray };
