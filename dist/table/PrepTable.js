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
import { Program } from './Program.js';
var PrepTable = /** @class */ (function (_super) {
    __extends(PrepTable, _super);
    function PrepTable(de, byte_ar) {
        var _this = _super.call(this) || this;
        byte_ar.seek(de.offset); // TODO
        _this.readInstructions(byte_ar, de.length);
        return _this;
    }
    PrepTable.prototype.getType = function () {
        return this.prep; // Ensure `prep` is defined in the class or inherited
    };
    return PrepTable;
}(Program));
export { PrepTable };
