import { Table } from "./Table.js";
export class MaxpTable {
    versionNumber;
    numGlyphs;
    maxPoints;
    maxContours;
    maxCompositePoints;
    maxCompositeContours;
    maxZones;
    maxTwilightPoints;
    maxStorage;
    maxFunctionDefs;
    maxInstructionDefs;
    maxStackElements;
    maxSizeOfInstructions;
    maxComponentElements;
    maxComponentDepth;
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        // console.log( "maxp offset",  byte_ar.offset);
        // Read properties from the ByteArray
        this.versionNumber = byte_ar.readInt();
        // console.log(this.versionNumber)
        this.numGlyphs = byte_ar.readUnsignedShort();
        // console.log("MAXP TABLE:::", this.numGlyphs);
        this.maxPoints = byte_ar.readUnsignedShort();
        // console.log(this.maxPoints)
        this.maxContours = byte_ar.readUnsignedShort();
        this.maxCompositePoints = byte_ar.readUnsignedShort();
        this.maxCompositeContours = byte_ar.readUnsignedShort();
        this.maxZones = byte_ar.readUnsignedShort();
        this.maxTwilightPoints = byte_ar.readUnsignedShort();
        this.maxStorage = byte_ar.readUnsignedShort();
        this.maxFunctionDefs = byte_ar.readUnsignedShort();
        this.maxInstructionDefs = byte_ar.readUnsignedShort();
        this.maxStackElements = byte_ar.readUnsignedShort();
        this.maxSizeOfInstructions = byte_ar.readUnsignedShort();
        this.maxComponentElements = byte_ar.readUnsignedShort();
        this.maxComponentDepth = byte_ar.readUnsignedShort();
    }
    getType() {
        return Table.maxp;
    }
}
