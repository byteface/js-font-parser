var DirectoryEntry = /** @class */ (function () {
    function DirectoryEntry(byteAr) {
        // console.log("Initial byteAr offset:", byteAr.offset);
        this.tag = byteAr.readInt();
        // console.log("Read tag:", this.tag, "New byteAr offset:", byteAr.offset);
        this.checksum = byteAr.readInt();
        // console.log("Read checksum:", this.checksum, "New byteAr offset:", byteAr.offset);
        this.offset = byteAr.readInt();
        // console.log("Read offset:", this.offset, "New byteAr offset:", byteAr.offset);
        this.length = byteAr.readInt();
        // console.log("Read length:", this.length, "New byteAr offset:", byteAr.offset);
        // console.log("DE:", this.tag, this.offset, this.length);
    }
    DirectoryEntry.prototype.toString = function () {
        var str = "";
        // str += ((this.tag >> 24) & 0xff) + ",";
        // str += ((this.tag >> 16) & 0xff) + ",";
        // str += ((this.tag >> 8) & 0xff) + ",";
        // str += (this.tag & 0xff) + ",";
        // Check if tag is not null before manipulating it
        if (this.tag !== null) {
            str += ((this.tag >> 24) & 0xff) + ",";
            str += ((this.tag >> 16) & 0xff) + ",";
            str += ((this.tag >> 8) & 0xff) + ",";
            str += (this.tag & 0xff) + ",";
        }
        else {
            str += "tag: null,";
        }
        str += " offset: ".concat(this.offset, ",");
        str += " length: ".concat(this.length, ",");
        str += " checksum: 0x".concat(this.checksum.toString(16)); // Using ! to assert checksum is not null
        return str;
    };
    return DirectoryEntry;
}());
export { DirectoryEntry };
