import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { Program } from './Program.js';
export declare class PrepTable extends Program {
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}
