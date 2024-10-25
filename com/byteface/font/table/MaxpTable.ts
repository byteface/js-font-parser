import { ByteArray } from "../utils/ByteArray.js";
import { Table } from "./Table.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";

export class MaxpTable implements ITable {
    versionNumber: number;
    numGlyphs: number;
    maxPoints: number;
    maxContours: number;
    maxCompositePoints: number;
    maxCompositeContours: number;
    maxZones: number;
    maxTwilightPoints: number;
    maxStorage: number;
    maxFunctionDefs: number;
    maxInstructionDefs: number;
    maxStackElements: number;
    maxSizeOfInstructions: number;
    maxComponentElements: number;
    maxComponentDepth: number;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
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

    getType(): number {
        return Table.maxp;
    }
}
