import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
export type FvarAxis = {
    tag: number;
    name: string;
    minValue: number;
    defaultValue: number;
    maxValue: number;
    flags: number;
    nameId: number;
};
export type FvarInstance = {
    nameId: number;
    flags: number;
    coordinates: number[];
    postScriptNameId?: number;
};
export declare class FvarTable implements ITable {
    majorVersion: number;
    minorVersion: number;
    axesArrayOffset: number;
    axisCount: number;
    axisSize: number;
    instanceCount: number;
    instanceSize: number;
    axes: FvarAxis[];
    instances: FvarInstance[];
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    private tagToString;
    getType(): string | number;
}
