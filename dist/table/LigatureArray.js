import { Anchor } from './Anchor.js';
var LigatureArray = /** @class */ (function () {
    function LigatureArray(byte_ar, offset, markClassCount) {
        this.ligatures = [];
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        this.ligatureCount = byte_ar.readUnsignedShort();
        var offsets = [];
        for (var i = 0; i < this.ligatureCount; i++) {
            offsets.push(byte_ar.readUnsignedShort());
        }
        this.ligatures = offsets.map(function (off) {
            var ligOffset = offset + off;
            byte_ar.offset = ligOffset;
            var componentCount = byte_ar.readUnsignedShort();
            var components = [];
            for (var c = 0; c < componentCount; c++) {
                var anchors = [];
                for (var m = 0; m < markClassCount; m++) {
                    var anchorOffset = byte_ar.readUnsignedShort();
                    anchors.push(Anchor.read(byte_ar, ligOffset + anchorOffset));
                }
                components.push(anchors);
            }
            return { components: components };
        });
        byte_ar.offset = prev;
    }
    return LigatureArray;
}());
export { LigatureArray };
