import { Panose } from './Panose.js';
import { Table } from './Table.js';
export class Os2Table {
    version = 0;
    xAvgCharWidth = 0;
    usWeightClass = 0;
    usWidthClass = 0;
    fsType = 0;
    ySubscriptXSize = 0;
    ySubscriptYSize = 0;
    ySubscriptXOffset = 0;
    ySubscriptYOffset = 0;
    ySuperscriptXSize = 0;
    ySuperscriptYSize = 0;
    ySuperscriptXOffset = 0;
    ySuperscriptYOffset = 0;
    yStrikeoutSize = 0;
    yStrikeoutPosition = 0;
    sFamilyClass = 0;
    panose = null;
    ulUnicodeRange1 = 0;
    ulUnicodeRange2 = 0;
    ulUnicodeRange3 = 0;
    ulUnicodeRange4 = 0;
    achVendorID = 0;
    fsSelection = 0;
    usFirstCharIndex = 0;
    usLastCharIndex = 0;
    sTypoAscender = 0;
    sTypoDescender = 0;
    sTypoLineGap = 0;
    usWinAscent = 0;
    usWinDescent = 0;
    ulCodePageRange1 = 0;
    ulCodePageRange2 = 0;
    sxHeight = 0;
    sCapHeight = 0;
    usDefaultChar = 0;
    usBreakChar = 0;
    usMaxContext = 0;
    usLowerOpticalPointSize = 0;
    usUpperOpticalPointSize = 0;
    constructor(de, byte_ar) {
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
        const buf = [];
        for (let i = 0; i < 10; i++) {
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
    getType() {
        return Table.OS_2;
    }
}
