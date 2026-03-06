import { Panose } from './Panose.js';
import { Table } from './Table.js';
var Os2Table = /** @class */ (function () {
    function Os2Table(de, byte_ar) {
        this.version = 0;
        this.xAvgCharWidth = 0;
        this.usWeightClass = 0;
        this.usWidthClass = 0;
        this.fsType = 0;
        this.ySubscriptXSize = 0;
        this.ySubscriptYSize = 0;
        this.ySubscriptXOffset = 0;
        this.ySubscriptYOffset = 0;
        this.ySuperscriptXSize = 0;
        this.ySuperscriptYSize = 0;
        this.ySuperscriptXOffset = 0;
        this.ySuperscriptYOffset = 0;
        this.yStrikeoutSize = 0;
        this.yStrikeoutPosition = 0;
        this.sFamilyClass = 0;
        this.panose = null;
        this.ulUnicodeRange1 = 0;
        this.ulUnicodeRange2 = 0;
        this.ulUnicodeRange3 = 0;
        this.ulUnicodeRange4 = 0;
        this.achVendorID = 0;
        this.fsSelection = 0;
        this.usFirstCharIndex = 0;
        this.usLastCharIndex = 0;
        this.sTypoAscender = 0;
        this.sTypoDescender = 0;
        this.sTypoLineGap = 0;
        this.usWinAscent = 0;
        this.usWinDescent = 0;
        this.ulCodePageRange1 = 0;
        this.ulCodePageRange2 = 0;
        this.sxHeight = 0;
        this.sCapHeight = 0;
        this.usDefaultChar = 0;
        this.usBreakChar = 0;
        this.usMaxContext = 0;
        this.usLowerOpticalPointSize = 0;
        this.usUpperOpticalPointSize = 0;
        byte_ar.offset = de.offset;
        this.version = byte_ar.readUnsignedShort();
        this.xAvgCharWidth = byte_ar.readShort();
        this.usWeightClass = byte_ar.readUnsignedShort();
        this.usWidthClass = byte_ar.readUnsignedShort();
        this.fsType = byte_ar.readShort();
        this.ySubscriptXSize = byte_ar.readShort();
        this.ySubscriptYSize = byte_ar.readShort();
        this.ySubscriptXOffset = byte_ar.readShort();
        this.ySubscriptYOffset = byte_ar.readShort();
        this.ySuperscriptXSize = byte_ar.readShort();
        this.ySuperscriptYSize = byte_ar.readShort();
        this.ySuperscriptXOffset = byte_ar.readShort();
        this.ySuperscriptYOffset = byte_ar.readShort();
        this.yStrikeoutSize = byte_ar.readShort();
        this.yStrikeoutPosition = byte_ar.readShort();
        this.sFamilyClass = byte_ar.readShort();
        var buf = [];
        for (var i = 0; i < 10; i++) {
            buf.push(byte_ar.readUnsignedByte());
        }
        this.panose = new Panose(buf);
        this.ulUnicodeRange1 = byte_ar.readInt();
        this.ulUnicodeRange2 = byte_ar.readInt();
        this.ulUnicodeRange3 = byte_ar.readInt();
        this.ulUnicodeRange4 = byte_ar.readInt();
        this.achVendorID = byte_ar.readInt();
        this.fsSelection = byte_ar.readShort();
        this.usFirstCharIndex = byte_ar.readShort();
        this.usLastCharIndex = byte_ar.readShort();
        this.sTypoAscender = byte_ar.readShort();
        this.sTypoDescender = byte_ar.readShort();
        this.sTypoLineGap = byte_ar.readShort();
        this.usWinAscent = byte_ar.readShort();
        this.usWinDescent = byte_ar.readShort();
        if (this.version >= 1) {
            this.ulCodePageRange1 = byte_ar.readInt();
            this.ulCodePageRange2 = byte_ar.readInt();
        }
        if (this.version >= 2) {
            this.sxHeight = byte_ar.readShort();
            this.sCapHeight = byte_ar.readShort();
            this.usDefaultChar = byte_ar.readUnsignedShort();
            this.usBreakChar = byte_ar.readUnsignedShort();
            this.usMaxContext = byte_ar.readUnsignedShort();
        }
        if (this.version >= 5) {
            this.usLowerOpticalPointSize = byte_ar.readUnsignedShort();
            this.usUpperOpticalPointSize = byte_ar.readUnsignedShort();
        }
    }
    Os2Table.prototype.getType = function () {
        return Table.OS_2;
    };
    return Os2Table;
}());
export { Os2Table };
