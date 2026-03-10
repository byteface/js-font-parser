// UNTESTED
import { FeatureRecord } from './FeatureRecord.js';
import { Feature } from './Feature.js';
var FeatureList = /** @class */ (function () {
    function FeatureList(byte_ar, offset) {
        byte_ar.offset = offset;
        this.featureCount = byte_ar.readUnsignedShort();
        this.featureRecords = new Array(this.featureCount);
        this.features = new Array(this.featureCount);
        this.tagToFeatureIndex = new Map();
        for (var i = 0; i < this.featureCount; i++) {
            this.featureRecords[i] = new FeatureRecord(byte_ar);
            this.tagToFeatureIndex.set(this.featureRecords[i].getTag(), i);
        }
        for (var j = 0; j < this.featureCount; j++) {
            this.features[j] = new Feature(byte_ar, offset + this.featureRecords[j].getOffset());
        }
    }
    FeatureList.prototype.findFeature = function (langSys, tag) {
        var _a;
        if (tag.length !== 4) {
            return null;
        }
        var tagVal = (tag.charCodeAt(0) << 24) |
            (tag.charCodeAt(1) << 16) |
            (tag.charCodeAt(2) << 8) |
            tag.charCodeAt(3);
        var featureIndex = this.tagToFeatureIndex.get(tagVal);
        if (featureIndex == null || !langSys.isFeatureIndexed(featureIndex))
            return null;
        return (_a = this.features[featureIndex]) !== null && _a !== void 0 ? _a : null;
    };
    FeatureList.prototype.getFeatureByIndex = function (index) {
        var _a;
        return (_a = this.features[index]) !== null && _a !== void 0 ? _a : null;
    };
    FeatureList.prototype.getFeatureRecords = function () {
        return this.featureRecords;
    };
    return FeatureList;
}());
export { FeatureList };
