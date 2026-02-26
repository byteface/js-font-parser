import { ClassDefFormat1 } from "./ClassDefFormat1.js";
import { ClassDefFormat2 } from "./ClassDefFormat2.js";
var ClassDef = /** @class */ (function () {
    function ClassDef() {
    }
    ClassDef.prototype.getFormat = function () {
        return 0;
    };
    ClassDef.read = function (byte_ar) {
        var format = byte_ar.readUnsignedShort();
        if (format === 1) {
            return new ClassDefFormat1(byte_ar);
        }
        if (format === 2) {
            return new ClassDefFormat2(byte_ar);
        }
        return null;
    };
    return ClassDef;
}());
export { ClassDef };
