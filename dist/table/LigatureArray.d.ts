import { ByteArray } from '../utils/ByteArray.js';
import { Anchor } from './Anchor.js';
export type LigatureAttach = {
    components: Array<Array<Anchor | null>>;
};
export declare class LigatureArray {
    ligatureCount: number;
    ligatures: LigatureAttach[];
    constructor(byte_ar: ByteArray, offset: number, markClassCount: number);
}
