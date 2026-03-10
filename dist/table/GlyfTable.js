import { ByteArray } from "../utils/ByteArray.js";
import { GlyfSimpleDescript } from "./GlyfSimpleDescript.js";
import { GlyfCompositeDescript } from "./GlyfCompositeDescript.js";
import { Table } from "./Table.js";
import { Debug } from "../utils/Debug.js";
export class GlyfTable {
    buf;
    descript;
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        const start = byte_ar.offset;
        const length = de.length;
        const slicedBuffer = byte_ar.dataView.buffer.slice(start, start + length);
        const uint8Array = new Uint8Array(slicedBuffer);
        this.buf = new ByteArray(uint8Array);
        this.descript = new Array(0);
    }
    run(numGlyphs, loca) {
        if (!this.buf) {
            return;
        }
        this.descript = [];
        for (let i = 0; i < numGlyphs; i++) {
            const offsetCurrent = loca.getOffset(i);
            const offsetNext = loca.getOffset(i + 1);
            const len = offsetNext - offsetCurrent;
            if (len > 0) {
                const bittie = new ByteArray(new Uint8Array(this.buf.dataView.buffer.slice(offsetCurrent, offsetCurrent + len)));
                const numberOfContours = bittie.readShort();
                if (numberOfContours < 0) {
                    this.descript.push(new GlyfCompositeDescript(this, bittie));
                }
                else {
                    Debug.log('Adds a glyf', numberOfContours);
                    // Handle simple glyph description
                    this.descript.push(new GlyfSimpleDescript(this, numberOfContours, bittie));
                }
            }
            else {
                this.descript.push(null);
            }
        }
        this.buf = null;
        for (let j = 0; j < numGlyphs; j++) {
            const desc = this.descript[j];
            if (!desc)
                continue;
            desc.resolve();
        }
        Debug.log("Glyph descriptions resolved");
    }
    // Return the description for the specified glyph index
    getDescription(i) {
        return this.descript[i];
    }
    getType() {
        return Table.glyf;
    }
}
