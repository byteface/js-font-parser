// UNTESTED
import { ByteArray } from '../utils/ByteArray';
import { KerningPair } from './KerningPair';
import { KernSubtableFormat0 } from './KernSubtableFormat0';
import { KernSubtableFormat2 } from './KernSubtableFormat2';
var KernSubtable = /** @class */ (function () {
    function KernSubtable() {
    }
    KernSubtable.prototype.getKerningPairCount = function () {
        return -1;
    };
    KernSubtable.prototype.getKerningPair = function (i) {
        console.warn("Attempting to retrieve kerning pair, but method is unimplemented.");
        return new KerningPair(new ByteArray());
    };
    KernSubtable.read = function (byte_ar) {
        var table = null;
        // /* const version = */ byte_ar.readUnsignedShort();
        // /* const length  = */ byte_ar.readUnsignedShort();
        var coverage = byte_ar.readUnsignedShort();
        var format = coverage >> 8;
        switch (format) {
            case 0:
                table = new KernSubtableFormat0(byte_ar);
                break;
            case 2:
                table = new KernSubtableFormat2(byte_ar);
                break;
            default:
                console.warn("Unsupported KernSubtable format: ".concat(format));
                break;
        }
        return table;
    };
    return KernSubtable;
}());
export { KernSubtable };
