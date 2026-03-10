export class CmapIndexEntry {
    platformId;
    encodingId;
    offset;
    constructor(byteArray) {
        this.platformId = byteArray.readUnsignedShort();
        this.encodingId = byteArray.readUnsignedShort();
        this.offset = byteArray.readInt();
    }
    toString() {
        let platform = "";
        let encoding = "";
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
        return `platform id: ${this.platformId}${platform}, encoding id: ${this.encodingId}${encoding}, offset: ${this.offset}`;
    }
}
