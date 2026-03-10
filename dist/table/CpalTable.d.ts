import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
export type CpalColorRecord = {
    red: number;
    green: number;
    blue: number;
    alpha: number;
};
export declare class CpalTable implements ITable {
    version: number;
    numPaletteEntries: number;
    numPalettes: number;
    numColorRecords: number;
    colorRecordsArrayOffset: number;
    paletteTypesArrayOffset: number;
    paletteLabelsArrayOffset: number;
    paletteEntryLabelsArrayOffset: number;
    colorRecordIndices: number[];
    colorRecords: CpalColorRecord[];
    paletteTypes: number[];
    paletteLabels: number[];
    paletteEntryLabels: number[];
    constructor(de: DirectoryEntry, byteArray: ByteArray);
    getPalette(index: number): CpalColorRecord[];
    getType(): string | number;
}
