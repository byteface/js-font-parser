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
import { Coverage } from './Coverage.js';
import { LookupSubtable } from './LookupSubtable.js';
import { Anchor } from './Anchor.js';
var CursivePosFormat1 = /** @class */ (function (_super) {
    __extends(CursivePosFormat1, _super);
    function CursivePosFormat1(byte_ar, offset) {
        var _this = _super.call(this) || this;
        _this.entryExitRecords = [];
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            _this.coverage = null;
            byte_ar.offset = prev;
            return _this;
        }
        var coverageOffset = byte_ar.readUnsignedShort();
        var entryExitCount = byte_ar.readUnsignedShort();
        var records = [];
        for (var i = 0; i < entryExitCount; i++) {
            records.push({
                entryOffset: byte_ar.readUnsignedShort(),
                exitOffset: byte_ar.readUnsignedShort()
            });
        }
        byte_ar.offset = offset + coverageOffset;
        _this.coverage = Coverage.read(byte_ar);
        _this.entryExitRecords = records.map(function (r) { return ({
            entry: Anchor.read(byte_ar, offset + r.entryOffset),
            exit: Anchor.read(byte_ar, offset + r.exitOffset)
        }); });
        byte_ar.offset = prev;
        return _this;
    }
    return CursivePosFormat1;
}(LookupSubtable));
export { CursivePosFormat1 };
