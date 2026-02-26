// UNTESTED
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
import { Program } from "./Program.js";
import { Table } from "./Table.js";
var FpgmTable = /** @class */ (function (_super) {
    __extends(FpgmTable, _super);
    function FpgmTable(de, byte_ar) {
        var _this = _super.call(this) || this;
        byte_ar.offset = de.offset;
        _this.readInstructions(byte_ar, de.length);
        return _this;
    }
    FpgmTable.prototype.getType = function () {
        return Table.fpgm;
    };
    return FpgmTable;
}(Program));
export { FpgmTable };
