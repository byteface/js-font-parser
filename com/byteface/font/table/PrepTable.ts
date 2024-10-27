// UNTESTED

import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { Program } from './Program.js';

export class PrepTable extends Program {

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        super();
        byte_ar.seek(de.offset); // TODO
        this.readInstructions(byte_ar, de.length);
    }

    public getType(): number {
        return this.prep; // Ensure `prep` is defined in the class or inherited
    }
}
