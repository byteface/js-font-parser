import { CmapFormat0 } from "./CmapFormat0.js";
import { CmapFormat2 } from "./CmapFormat2.js";
import { CmapFormat4 } from "./CmapFormat4.js";
import { CmapFormat6 } from "./CmapFormat6.js";
import { CmapFormat8 } from "./CmapFormat8.js";
import { CmapFormat10 } from "./CmapFormat10.js";
import { CmapFormat12 } from "./CmapFormat12.js";
var CmapFormat = /** @class */ (function () {
    function CmapFormat() {
        this.format = 0;
        this.length = 0;
        this.version = 0;
    }
    // constructor(byte_ar: ByteArray) {
    // this.length = byte_ar.readUnsignedShort();
    // this.version = byte_ar.readUnsignedShort();
    // }
    CmapFormat.create = function (format, byte_ar) {
        console.log("cmap create", format);
        switch (format) {
            case 0:
                return new CmapFormat0(byte_ar);
            case 2:
                return new CmapFormat2(byte_ar);
            case 4:
                return new CmapFormat4(byte_ar);
            case 6:
                return new CmapFormat6(byte_ar);
            case 8:
                return new CmapFormat8(byte_ar);
            case 10:
                return new CmapFormat10(byte_ar);
            case 12:
                return new CmapFormat12(byte_ar);
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
