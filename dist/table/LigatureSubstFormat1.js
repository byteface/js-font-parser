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
import { Coverage } from "./Coverage";
import { LigatureSet } from "./LigatureSet";
import { LigatureSubst } from "./LigatureSubst";
var LigatureSubstFormat1 = /** @class */ (function (_super) {
    __extends(LigatureSubstFormat1, _super);
    function LigatureSubstFormat1(byteAr, offset) {
        var _this = _super.call(this) || this;
        _this.coverageOffset = byteAr.readUnsignedShort();
        _this.ligSetCount = byteAr.readUnsignedShort();
        _this.ligatureSetOffsets = new Array(_this.ligSetCount);
        _this.ligatureSets = new Array(_this.ligSetCount);
        for (var i = 0; i < _this.ligSetCount; i++) {
            _this.ligatureSetOffsets[i] = byteAr.readUnsignedShort();
        }
        byteAr.offset = offset + _this.coverageOffset;
        _this.coverage = Coverage.read(byteAr); // Coverage may be null if read fails
        for (var j = 0; j < _this.ligSetCount; j++) {
            _this.ligatureSets[j] = new LigatureSet(byteAr, offset + _this.ligatureSetOffsets[j]);
        }
        return _this;
    }
    LigatureSubstFormat1.prototype.getFormat = function () {
        return 1;
    };
    return LigatureSubstFormat1;
}(LigatureSubst));
export { LigatureSubstFormat1 };
