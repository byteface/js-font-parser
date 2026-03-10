// UNTESTED

import { ByteArray } from '../utils/ByteArray.js';
import { FeatureRecord } from './FeatureRecord.js';
import { Feature } from './Feature.js';
import { LangSys } from './LangSys.js';

export class FeatureList {
    featureCount: number;
    featureRecords: FeatureRecord[];
    features: Feature[];
    private tagToFeatureIndex: Map<number, number>;

    constructor(byte_ar: ByteArray, offset: number) {
        byte_ar.offset = offset;

        this.featureCount = byte_ar.readUnsignedShort();
        this.featureRecords = new Array<FeatureRecord>(this.featureCount);
        this.features = new Array<Feature>(this.featureCount);
        this.tagToFeatureIndex = new Map<number, number>();

        for (let i = 0; i < this.featureCount; i++) {
            this.featureRecords[i] = new FeatureRecord(byte_ar);
            this.tagToFeatureIndex.set(this.featureRecords[i].getTag(), i);
        }
        for (let j = 0; j < this.featureCount; j++) {
            this.features[j] = new Feature(byte_ar, offset + this.featureRecords[j].getOffset());
        }
    }

    findFeature(langSys: LangSys, tag: string): Feature | null {
        if (tag.length !== 4) {
            return null;
        }

        const tagVal =
            (tag.charCodeAt(0) << 24) |
            (tag.charCodeAt(1) << 16) |
            (tag.charCodeAt(2) << 8) |
            tag.charCodeAt(3);

        const featureIndex = this.tagToFeatureIndex.get(tagVal);
        if (featureIndex == null || !langSys.isFeatureIndexed(featureIndex)) return null;
        return this.features[featureIndex] ?? null;
    }

    getFeatureByIndex(index: number): Feature | null {
        return this.features[index] ?? null;
    }

    getFeatureRecords(): FeatureRecord[] {
        return this.featureRecords;
    }
}
