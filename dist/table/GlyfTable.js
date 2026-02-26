import { ByteArray } from "../utils/ByteArray.js";
import { GlyfSimpleDescript } from "./GlyfSimpleDescript.js";
import { GlyfCompositeDescript } from "./GlyfCompositeDescript.js";
import { Table } from "./Table.js";
import { Debug } from "../utils/Debug.js";
var GlyfTable = /** @class */ (function () {
    function GlyfTable(de, byte_ar) {
        // console.log('Glyf Table')
        byte_ar.offset = de.offset;
        // Create a new ByteArray from the DataView using the specified offset and length
        var start = byte_ar.offset;
        var length = de.length;
        // Create a new ArrayBuffer from the DataView
        var slicedBuffer = byte_ar.dataView.buffer.slice(start, start + length);
        var uint8Array = new Uint8Array(slicedBuffer);
        // Initialize the buffer using the sliced Uint8Array
        this.buf = new ByteArray(uint8Array); // No endian parameter
        this.descript = new Array(0); // Start with an empty array
    }
    GlyfTable.prototype.run = function (numGlyphs, loca) {
        if (!this.buf) {
            return;
        }
        this.descript = [];
        for (var i = 0; i < numGlyphs; i++) {
            var offsetCurrent = loca.getOffset(i);
            var offsetNext = loca.getOffset(i + 1);
            var len = offsetNext - offsetCurrent;
            // console.log("OFFSET::", offsetCurrent, offsetNext, len );
            // console.log(`Buffer length: ${this.buf.dataView.byteLength}`);
            if (len > 0) {
                // Create a new ByteArray, starting at the current glyph offset
                var bittie = new ByteArray(new Uint8Array(this.buf.dataView.buffer.slice(offsetCurrent, offsetCurrent + len)));
                // Read number of contours (int16). Negative means composite glyph.
                var numberOfContours = bittie.readShort();
                if (numberOfContours < 0) {
                    this.descript.push(new GlyfCompositeDescript(this, bittie));
                }
                else {
                    Debug.log('Adds a glyf', numberOfContours);
                    // Handle simple glyph description
                    this.descript.push(new GlyfSimpleDescript(this, numberOfContours, bittie));
                }
            }
            else {
                // Empty glyph; keep index alignment
                this.descript.push(null);
            }
        }
        // Clear buffer after processing
        this.buf = null;
        // Resolve all glyphs
        for (var j = 0; j < numGlyphs; j++) {
            if (!this.descript[j])
                continue;
            this.descript[j].resolve();
        }
        Debug.log("Glyph descriptions resolved");
    };
    // Return the description for the specified glyph index
    GlyfTable.prototype.getDescription = function (i) {
        return this.descript[i];
    };
    GlyfTable.prototype.getType = function () {
        return Table.glyf;
    };
    return GlyfTable;
}());
export { GlyfTable };
// , run: function( numGlyphs, loca )
// {    
//     if (this.buf == null) {
//         return;
//     }	
//     this.descript = [];
//     for(var i=0; i < numGlyphs; i++)
//     {
//         var len = loca.getOffset((i + 1)) - loca.getOffset(i);
//         var bittie = new a3d.ByteArray( this.buf.data.substr(this.buf.offset,this.buf.data.length), a3d.Endian.BIG );        
//         this.buf.offset = 0;
//         if (len > 0) {
//             bittie.offset = 0;
//             bittie.offset = loca.getOffset(i);
//             var numberOfContours = 0;
//             numberOfContours = bittie.readUnsignedByte()<<8 | bittie.readUnsignedByte();
//             if(numberOfContours>255)numberOfContours=-1; // FIXME - LOTS TO SORT HERE
//             if (numberOfContours >= 0) {
//                 this.descript.push( new GlyfSimpleDescript(this, numberOfContours, bittie) );
//             } else {
//                // this.descript.push( new GlyfCompositeDescript(this, bittie) );
//             }
//         }
//     }
//     this.buf = null;
//     for(var j=0; j < numGlyphs; j++){
//         if(this.descript[j] == null) continue;
//         this.descript[j].resolve();
//     }
// }
/*

 
GlyfTable = Class.extend({

    buf:null,
    descript:null,
        
init: function(de, byte_ar)
{
    byte_ar.offset = de.offset;
    
//    this.buf = new a3d.ByteArray( "", a3d.Endian.BIG );
    //byte_ar.readBytes( this.buf, 0, de.length );
    
   // this.buf = new a3d.ByteArray( byte_ar.data, a3d.Endian.BIG );
                   //var len = byte_ar.readUnsignedByte();
                            
                this.buf = new a3d.ByteArray( byte_ar.data.substr(byte_ar.offset,de.length), a3d.Endian.BIG );
                //byte_ar.offset += de.length;
}

, run: function( numGlyphs, loca )
{
    //alert( "the number of glyphs avail:" + numGlyphs );
    
    if (this.buf == null) {
        return;
    }
    
    this.descript = [];
    
    for(var i=0; i < numGlyphs; i++)
    {
        var len = loca.getOffset((i + 1)) - loca.getOffset(i);
        
        
        //		var bittie:ByteArray = new ByteArray();// = buf;//new ByteArray();
        //		buf.readBytes( bittie, 0, buf.length-buf.offsetition );// - buf.offsetition );
        //		buf.offsetition = 0;
        
        
//window.console.log("LEN:"+len);
        
        //var bittie = new a3d.ByteArray( "", a3d.Endian.BIG );
        //this.buf.readBytes( bittie, 0, this.buf.length-this.buf.offsetition );
        
          var bittie = new a3d.ByteArray( this.buf.data.substr(this.buf.offset,this.buf.data.length), a3d.Endian.BIG );
//        var bittie = new a3d.ByteArray( byte_ar.data.substr(byte_ar.offset,de.length), a3d.Endian.BIG );
        
        this.buf.offset = 0;
        
        if (len > 0) {
        
            bittie.offset = 0;
            bittie.offset = loca.getOffset(i);
            
            //var numberOfContours:Number = int( bittie.readByte()<<8 | bittie.readByte() );
            var numberOfContours = 0;
//            try
  //          {
                numberOfContours = bittie.readUnsignedByte()<<8 | bittie.readUnsignedByte();
    //        }
      //      catch(er:EOFError)
        //    {
         
          //      numberOfContours = -1;
            //}
            
            
           // alert(numberOfContours);
            
            if(numberOfContours>255)numberOfContours=-1; // FIXME - LOTS TO SORT HERE

            if (numberOfContours >= 0) {
                this.descript.push( new GlyfSimpleDescript(this, numberOfContours, bittie) );
            } else {
               // this.descript.push( new GlyfCompositeDescript(this, bittie) );
            }
       
        }
    }
    
    this.buf = null;

    for(var j=0; j < numGlyphs; j++){
        if(this.descript[j] == null) continue;

        this.descript[j].resolve();
    }
    
}

, getDescription: function(i)
{
    return this.descript[i];
}

, getType: function(){
    return Table.glyf;
}

});

*/ 
