import { Table } from '../table/Table.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { GlyphData } from '../data/GlyphData.js';
var RawFont = /** @class */ (function () {
    function RawFont(byteData) {
        // Define properties
        this.os2 = null;
        this.cmap = null;
        this.glyf = null;
        this.head = null;
        this.hhea = null;
        this.hmtx = null;
        this.loca = null;
        this.maxp = null;
        this.pName = null;
        this.post = null;
        // Table directory and tables
        this.tableDir = null;
        this.tables = [];
        this.init(byteData);
    }
    // Load additional scripts dynamically (consider using ES6 imports instead)
    // private inc(filename: string): void {
    //     const body = document.getElementsByTagName('body')[0];
    //     const script = document.createElement('script');
    //     script.src = filename;
    //     script.type = 'text/javascript';
    //     body.appendChild(script);
    // }
    // Initialize the RawFont instance
    RawFont.prototype.init = function (byteData) {
        var _a, _b, _c, _d;
        // Initialize the table directory
        this.tableDir = new TableDirectory(byteData);
        this.tables = [];
        // Load each of the tables
        for (var i = 0; i < this.tableDir.numTables; i++) {
            var tf = new TableFactory();
            var tab = tf.create(this.tableDir.getEntry(i), byteData);
            if (tab !== null) {
                this.tables.push(tab);
            }
        }
        // Get references to the tables
        this.os2 = this.getTable(Table.OS_2);
        this.cmap = this.getTable(Table.cmap);
        this.glyf = this.getTable(Table.glyf);
        this.head = this.getTable(Table.head);
        this.hhea = this.getTable(Table.hhea);
        this.hmtx = this.getTable(Table.hmtx);
        this.loca = this.getTable(Table.loca);
        this.maxp = this.getTable(Table.maxp);
        this.pName = this.getTable(Table.pName);
        this.post = this.getTable(Table.post);
        // Initialize the tables
        if (this.hmtx && this.maxp) {
            this.hmtx.run((_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.numberOfHMetrics) !== null && _b !== void 0 ? _b : 0, this.maxp.numGlyphs - ((_d = (_c = this.hhea) === null || _c === void 0 ? void 0 : _c.numberOfHMetrics) !== null && _d !== void 0 ? _d : 0));
        }
        if (this.loca && this.maxp && this.head) {
            this.loca.run(this.maxp.numGlyphs, this.head.indexToLocFormat === 0);
        }
        if (this.glyf && this.loca && this.maxp) {
            // console.log(">>>>>>>>>>>>>>>>>>>>",this.maxp.numGlyphs);
            this.glyf.run(this.maxp.numGlyphs, this.loca);
        }
    };
    // Get a glyph description by index
    RawFont.prototype.getGlyph = function (i) {
        var _a, _b, _c, _d, _e;
        var description = (_a = this.glyf) === null || _a === void 0 ? void 0 : _a.getDescription(i);
        return description != null
            ? new GlyphData(description, (_c = (_b = this.hmtx) === null || _b === void 0 ? void 0 : _b.getLeftSideBearing(i)) !== null && _c !== void 0 ? _c : 0, (_e = (_d = this.hmtx) === null || _d === void 0 ? void 0 : _d.getAdvanceWidth(i)) !== null && _e !== void 0 ? _e : 0)
            : null;
    };
    // Get the number of glyphs
    RawFont.prototype.getNumGlyphs = function () {
        var _a, _b;
        return (_b = (_a = this.maxp) === null || _a === void 0 ? void 0 : _a.numGlyphs) !== null && _b !== void 0 ? _b : 0;
    };
    // Get the ascent value
    RawFont.prototype.getAscent = function () {
        var _a, _b;
        return (_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.ascender) !== null && _b !== void 0 ? _b : 0;
    };
    // Get the descent value
    RawFont.prototype.getDescent = function () {
        var _a, _b;
        return (_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.descender) !== null && _b !== void 0 ? _b : 0;
    };
    // Return a table by type
    RawFont.prototype.getTable = function (tableType) {
        //alert("lll"+tableType) // FIXME - why does the word table trace here?
        for (var i = 0; i < this.tables.length; i++) {
            if ((this.tables[i] != null) && (this.tables[i].getType() == tableType)) {
                return this.tables[i];
            }
        }
        return null;
    };
    return RawFont;
}());
export { RawFont };
/*
RawFont = Class.extend({

    // tables
    os2:null,
    cmap:null,
    glyf:null,
    head:null,
    hhea:null,
    hmtx:null,
    loca:null,
    maxp:null,
    pName:null,
    post:null,
    
    // table dir
    tableDir:null,
    tables:null

// TODO - create a class for global functions like this one
, inc: function(filename){
    var body = document.getElementsByTagName('body').item(0);
    script = document.createElement('script');
    script.src = filename;
    script.type = 'text/javascript';
    body.appendChild(script);
}

, init: function(byte_data)
{
    // import all the required classes ??
    // this.inc("com/byteface/font/Class.js");
    // this.inc("com/byteface/font/table/TableDirectory.js");
    // this.inc("com/byteface/font/table/DirectoryEntry.js");
    // this.inc("com/byteface/font/table/TableFactory.js");
    // this.inc("com/byteface/font/table/Os2Table.js");
    // this.inc("com/byteface/font/table/Panose.js");
    // this.inc("com/byteface/font/table/Table.js");
    // this.inc("com/byteface/font/table/CmapTable.js");
    // this.inc("com/byteface/font/table/GlyfTable.js");
    // this.inc("com/byteface/font/table/HeadTable.js");
    // this.inc("com/byteface/font/table/CmapIndexEntry.js");
    // this.inc("com/byteface/font/table/CmapFormat.js");
    // this.inc("com/byteface/font/table/CmapFormat0.js");
    // this.inc("com/byteface/font/table/CmapFormat2.js");
    // this.inc("com/byteface/font/table/CmapFormat4.js");
    // this.inc("com/byteface/font/table/CmapFormat6.js");
    // this.inc("com/byteface/font/table/HheaTable.js");
    // this.inc("com/byteface/font/table/HmtxTable.js");
    // this.inc("com/byteface/font/table/LocaTable.js");
    // this.inc("com/byteface/font/table/NameTable.js");
    // this.inc("com/byteface/font/table/NameRecord.js");
    // this.inc("com/byteface/font/table/MaxpTable.js");
    // this.inc("com/byteface/font/table/PostTable.js");
    // this.inc("com/byteface/font/table/GsubTable.js");
    // this.inc("com/byteface/font/table/KernTable.js");
    // this.inc("com/byteface/font/table/GlyfSimpleDescript.js");
    // this.inc("com/byteface/font/table/GlyfCompositeDescript.js");
    // this.inc("com/byteface/font/table/GlyfCompositeComp.js");
    // this.inc("com/byteface/font/table/Script.js");
    // this.inc("com/byteface/font/table/ScriptRecord.js");
    // this.inc("com/byteface/font/data/GlyphData.js");
    // this.inc("com/byteface/font/data/Point.js");
    // this.inc("com/byteface/font/constants/CSSConstants.js");
    // this.inc("com/byteface/font/constants/SVGConstants.js");
    // this.inc("com/byteface/font/constants/XMLConstants.js");
    
    // setup the tables
    this.tableDir = new TableDirectory( byte_data );
    this.tables = [];

    // Load each of the tables
    for( var i=0; i<this.tableDir.numTables; i++ )
    {
        var tf = new TableFactory();
        var tab = tf.create( this.tableDir.getEntry(i), byte_data );
        this.tables.push( tab );
    }
    
    // Get references to to the tables
    this.os2  = this.getTable( Table.OS_2 );
    this.cmap = this.getTable( Table.cmap );
    this.glyf = this.getTable( Table.glyf );
    this.head = this.getTable( Table.head );
    this.hhea = this.getTable( Table.hhea );
    this.hmtx = this.getTable( Table.hmtx );
    this.loca = this.getTable( Table.loca );
    this.maxp = this.getTable( Table.maxp );
    this.pName = this.getTable( Table.pName ); // had to change due to name being a property
    this.post = this.getTable( Table.post );
    
    // Initialize the tables
    this.hmtx.run( this.hhea.numberOfHMetrics, this.maxp.numGlyphs - this.hhea.numberOfHMetrics );
    this.loca.run( this.maxp.numGlyphs, this.head.indexToLocFormat == 0 );
    this.glyf.run( this.maxp.numGlyphs, this.loca );
}

, getGlyph: function(i){

//   window.console.log( "getGlyph:::" + i );
//   window.console.log( "getGlyph:" + this.glyf.getDescription(i) );

    return ( this.glyf.getDescription(i) != null ) ? new GlyphData( this.glyf.getDescription(i), this.hmtx.getLeftSideBearing(i), this.hmtx.getAdvanceWidth(i) ) : null;
}


// useful methods
, getNumGlyphs: function(){ return this.maxp.numGlyphs; }
, getAscent: function(){ return hhea.ascender(); }
, getDescent: function(){ return hhea.descender(); }

// return a table by type
, getTable: function( tableType )
{
//alert("lll"+tableType) // FIXME - why does the word table trace here?
    for (var i=0; i < this.tables.length; i++)
    {
        if( (this.tables[i] != null) && (this.tables[i].getType() == tableType) )
        {
            return this.tables[i];
        }
    }
    return null;
}

});
*/ 
