import { CmapFormat0 } from "./CmapFormat0.js";
import { CmapFormat2 } from "./CmapFormat2.js";
import { CmapFormat4 } from "./CmapFormat4.js";
import { CmapFormat6 } from "./CmapFormat6.js";
var CmapFormat = /** @class */ (function () {
    function CmapFormat(byte_ar) {
        this.format = 0;
        this.length = 0;
        this.version = 0;
        this.length = byte_ar.readUnsignedShort();
        this.version = byte_ar.readUnsignedShort();
    }
    CmapFormat.create = function (format, byte_ar) {
        switch (format) {
            case 0:
                return new CmapFormat0(byte_ar);
            case 2:
                return new CmapFormat2(byte_ar);
            case 4:
                return new CmapFormat4(byte_ar);
            case 6:
                return new CmapFormat6(byte_ar);
            default:
                return null;
        }
    };
    CmapFormat.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", version: ").concat(this.version);
    };
    return CmapFormat;
}());
export { CmapFormat };
