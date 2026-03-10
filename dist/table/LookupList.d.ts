import { ByteArray } from "../utils/ByteArray.js";
import { Feature } from "./Feature.js";
import { Lookup } from "./Lookup.js";
export declare class LookupList {
    private lookupCount;
    private lookupOffsets;
    private lookups;
    constructor(byte_ar: ByteArray, offset: number, factory: any);
    getLookup(feature: Feature, index: number): Lookup | null;
    getLookups(): Lookup[];
}
