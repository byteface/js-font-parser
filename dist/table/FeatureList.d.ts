import { ByteArray } from '../utils/ByteArray.js';
import { FeatureRecord } from './FeatureRecord.js';
import { Feature } from './Feature.js';
import { LangSys } from './LangSys.js';
export declare class FeatureList {
    featureCount: number;
    featureRecords: FeatureRecord[];
    features: Feature[];
    private tagToFeatureIndex;
    constructor(byte_ar: ByteArray, offset: number);
    findFeature(langSys: LangSys, tag: string): Feature | null;
    getFeatureByIndex(index: number): Feature | null;
    getFeatureRecords(): FeatureRecord[];
}
