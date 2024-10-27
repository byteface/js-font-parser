var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { LigatureSubstFormat1 } from "./LigatureSubstFormat1.js";
import { LookupSubtable } from "./LookupSubtable.js";
var LigatureSubst = /** @class */ (function (_super) {
    __extends(LigatureSubst, _super);
    function LigatureSubst() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Reads a LigatureSubst from the given ByteArray and offset.
     * @param byteAr The ByteArray to read from.
     * @param offset The offset from which to start reading.
     * @return An instance of LigatureSubst or null if format is not recognized.
     */
    LigatureSubst.read = function (byteAr, offset) {
        byteAr.offset = offset;
        var format = byteAr.readUnsignedShort();
        var ls = null;
        if (format === 1) {
            ls = new LigatureSubstFormat1(byteAr, offset);
        }
        return ls;
    };
    return LigatureSubst;
}(LookupSubtable));
export { LigatureSubst };
