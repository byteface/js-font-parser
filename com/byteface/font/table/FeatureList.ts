// UNTESTED

import { ByteArray } from '../utils/ByteArray';
import { FeatureRecord } from './FeatureRecord';
import { Feature } from './Feature';
import { LangSys } from './LangSys';

export class FeatureList {
    featureCount: number;
    featureRecords: FeatureRecord[];
    features: Feature[];

    constructor(byte_ar: ByteArray, offset: number) {
        byte_ar.offset = offset;

        this.featureCount = byte_ar.readUnsignedShort();
        this.featureRecords = new Array<FeatureRecord>(this.featureCount);
        this.features = new Array<Feature>(this.featureCount);

        for (let i = 0; i < this.featureCount; i++) {
            this.featureRecords[i] = new FeatureRecord(byte_ar);
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

        for (let i = 0; i < this.featureCount; i++) {
            if (this.featureRecords[i].getTag() === tagVal) {
                if (langSys.isFeatureIndexed(i)) {
                    return this.features[i];
                }
            }
        }
        return null;
    }
}
