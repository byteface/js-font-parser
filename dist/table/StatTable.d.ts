import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
type StatAxis = {
    tag: string;
    nameId: number;
    ordering: number;
};
type StatAxisValue = {
    format: number;
    axisIndex?: number;
    flags?: number;
    valueNameId?: number;
    value?: number;
    linkedValue?: number;
    nominalValue?: number;
    rangeMinValue?: number;
    rangeMaxValue?: number;
    axisValues?: Array<{
        axisIndex: number;
        value: number;
    }>;
};
export declare class StatTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    designAxisSize: number;
    designAxisCount: number;
    designAxesOffset: number;
    axisValueCount: number;
    offsetToAxisValueOffsets: number;
    elidedFallbackNameId: number;
    designAxes: StatAxis[];
    axisValues: StatAxisValue[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    private readAxisValue;
    getType(): number;
}
export {};
