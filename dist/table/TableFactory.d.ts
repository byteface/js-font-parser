import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
export declare class TableFactory {
    constructor();
    create(de: DirectoryEntry, byte_ar: ByteArray): any | null;
}
