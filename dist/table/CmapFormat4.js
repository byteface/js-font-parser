var CmapFormat4 = /** @class */ (function () {
    function CmapFormat4(byteArray) {
        this.length = byteArray.readUnsignedShort();
        this.version = byteArray.readUnsignedShort();
        this.language = 0;
        this.format = 4;
        this.segCountX2 = byteArray.readUnsignedShort();
        this.segCount = this.segCountX2 / 2;
        this.endCode = [];
        this.startCode = [];
        this.idDelta = [];
        this.idRangeOffset = [];
        this.searchRange = byteArray.readUnsignedShort();
        this.entrySelector = byteArray.readUnsignedShort();
        this.rangeShift = byteArray.readUnsignedShort();
        this.last = -1;
        for (var i = 0; i < this.segCount; i++) {
            this.endCode.push(byteArray.readUnsignedShort());
            if (this.endCode[i] > this.last)
                this.last = this.endCode[i];
        }
        byteArray.readUnsignedShort(); // reservePad
        this.first = Number.MAX_SAFE_INTEGER; // Initialize with maximum value
        for (var j = 0; j < this.segCount; j++) {
            this.startCode.push(byteArray.readUnsignedShort());
            if (this.startCode[j] < this.first)
                this.first = this.startCode[j];
        }
        for (var k = 0; k < this.segCount; k++) {
            this.idDelta.push(byteArray.readUnsignedShort());
        }
        for (var l = 0; l < this.segCount; l++) {
            this.idRangeOffset.push(byteArray.readUnsignedShort());
        }
        // Whatever remains of this header belongs in glyphIdArray
        var count = (this.length - 16 - (this.segCount * 8)) / 2;
        this.glyphIdArray = [];
        for (var m = 0; m < count; m++) {
            this.glyphIdArray.push(byteArray.readUnsignedShort());
        }
    }
    CmapFormat4.prototype.getFirst = function () {
        return this.first;
    };
    CmapFormat4.prototype.getLast = function () {
        return this.last;
    };
    CmapFormat4.prototype.mapCharCode = function (charCode) {
        // Handle out-of-bounds
        if (charCode < 0 || charCode >= 0xFFFE)
            return 0;
        for (var i = 0; i < this.segCount; i++) {
            if (this.endCode[i] >= charCode) {
                if (this.startCode[i] <= charCode) {
                    if (this.idRangeOffset[i] > 0) {
                        return this.glyphIdArray[this.idRangeOffset[i] / 2 +
                            (charCode - this.startCode[i]) -
                            (this.segCount - i)];
                    }
                    else {
                        return (this.idDelta[i] + charCode) % 65536;
                    }
                }
                else {
                    break;
                }
            }
        }
        return 0;
    };
    CmapFormat4.prototype.toString = function () {
        return "format: ".concat(this.format, ", length: ").concat(this.length, ", version: ").concat(this.version, ", ") +
            "segCountX2: ".concat(this.segCountX2, ", searchRange: ").concat(this.searchRange, ", ") +
            "entrySelector: ".concat(this.entrySelector, ", rangeShift: ").concat(this.rangeShift, ", ") +
            "endCode: ".concat(this.endCode, ", startCode: ").concat(this.startCode, ", ") +
            "idDelta: ".concat(this.idDelta, ", idRangeOffset: ").concat(this.idRangeOffset);
    };
    return CmapFormat4;
}());
export { CmapFormat4 };
/*
CmapFormat4 = Class.extend({

    format:0,
    length:0,
    version:0,

    language:0,
    segCountX2:0,
    searchRange:0,
    entrySelector:0,
    rangeShift:0,
    endCode:null,
    startCode:null,
    idDelta:null,
    idRangeOffset:null,
    glyphIdArray:null,
    segCount:0,
    first:0,
    last:0,
        
init: function( byte_ar )
{
    this.length = byte_ar.readUnsignedShort();
    this.version = byte_ar.readUnsignedShort();
    
    this.format = 4;
    this.segCountX2 = byte_ar.readUnsignedShort();
    this.segCount = this.segCountX2 / 2;
    this.endCode = [];
    this.startCode = [];
    this.idDelta = [];
    this.idRangeOffset = [];
    this.searchRange = byte_ar.readUnsignedShort();
    this.entrySelector = byte_ar.readUnsignedShort();
    this.rangeShift = byte_ar.readUnsignedShort();
    
    this.last = -1;
    for (var i=0; i < this.segCount; i++) {
        this.endCode.push( byte_ar.readUnsignedShort() );
        if (this.endCode[i] > this.last) this.last = this.endCode[i];
    }
    
    byte_ar.readUnsignedShort(); // reservePad
    
    for (var j=0; j < this.segCount; j++) {
        this.startCode.push( byte_ar.readUnsignedShort() );
        if ((j==0) || (this.startCode[j] < this.first)) this.first = this.startCode[j];
    }
    
    for (var k=0; k < this.segCount; k++) {
        this.idDelta.push( byte_ar.readUnsignedShort() );
    }
    
    for (var l=0; l < this.segCount; l++) {
        this.idRangeOffset.push( byte_ar.readUnsignedShort() );
    }

    // Whatever remains of this header belongs in glyphIdArray
    var count = (this.length - 16- (this.segCount*8)) / 2;
    this.glyphIdArray = [];
    for (var m=0; m < count; m++) {
        this.glyphIdArray.push( byte_ar.readUnsignedShort() );
    }
}

, getFirst: function(){ return this.first; }
, getLast: function(){ return this.last; }

, mapCharCode: function(charCode){
   
   // TODO - whats javascript equiv of try catch?
   
   //try {

        //   Quoting :
        //   http://developer.apple.com/fonts/TTRefMan/RM06/Chap6cmap.html#Surrogates

        //   The original architecture of the Unicode Standard
        //   allowed for all encoded characters to be represented
        //   using sixteen bit code points. This allowed for up to
        //   65,354 characters to be encoded. (Unicode code points
        //   U+FFFE and U+FFFF are reserved and unavailable to
        //   represent characters. For more details, see The Unicode
        //   Standard.)

        //   My comment : Isn't there a typo here ? Shouldn't we
        //   rather read 65,534 ?

        if ((charCode < 0) || (charCode >= 0xFFFE)) return 0;

        for (var i=0; i < this.segCount; i++) {
            if (this.endCode[i] >= charCode) {
                if (this.startCode[i] <= charCode) {
                    if (this.idRangeOffset[i] > 0) {
                        return this.glyphIdArray[this.idRangeOffset[i]/2+
                                            (charCode - this.startCode[i]) -
                                            (this.segCount - i)];
                    } else {
                        return (this.idDelta[i] + charCode) % 65536;
                    }
                } else {
                    break;
                }
            }
        }
  //  } catch (e:ArrayIndexOutOfBoundsException) { // TODO**
    //    System.err.println("error: Array out of bounds - " + e.getMessage());
    //}
    return 0;
}

, toString: function()
{
    var str = "format: " + format + ", length: " + length + ", version: " + version;
    str += ", segCOuntX2: " + segCountX2 + ", searchRange: " + searchRange + ", entrySelector: " + entrySelector;
    str += ", rangeShift: " + rangeShift + ", endCode: " + endCode + ", startCode: " + startCode + ", idDelta: " + idDelta;
    str += ", idRangeOffset: " + idRangeOffset;
    return str;
}

});
*/ 
