var CmapIndexEntry = /** @class */ (function () {
    function CmapIndexEntry(byteArray) {
        this.platformId = byteArray.readUnsignedShort();
        this.encodingId = byteArray.readUnsignedShort();
        this.offset = byteArray.readInt();
    }
    CmapIndexEntry.prototype.toString = function () {
        var platform = "";
        var encoding = "";
        switch (this.platformId) {
            case 1:
                platform = " (Macintosh)";
                break;
            case 3:
                platform = " (Windows)";
                break;
            default:
                platform = "";
        }
        if (this.platformId === 3) {
            // Windows specific encodings
            switch (this.encodingId) {
                case 0:
                    encoding = " (Symbol)";
                    break;
                case 1:
                    encoding = " (Unicode)";
                    break;
                case 2:
                    encoding = " (ShiftJIS)";
                    break;
                case 3:
                    encoding = " (Big5)";
                    break;
                case 4:
                    encoding = " (PRC)";
                    break;
                case 5:
                    encoding = " (Wansung)";
                    break;
                case 6:
                    encoding = " (Johab)";
                    break;
                default:
                    encoding = "";
            }
        }
        return "platform id: ".concat(this.platformId).concat(platform, ", encoding id: ").concat(this.encodingId).concat(encoding, ", offset: ").concat(this.offset);
    };
    return CmapIndexEntry;
}());
export { CmapIndexEntry };
