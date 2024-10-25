import { ByteArray } from '../utils/ByteArray.js';
import { Os2Table } from '../table/Os2Table.js';
import { CmapTable } from '../table/CmapTable.js';
import { GlyfTable } from '../table/GlyfTable.js';
import { HeadTable } from '../table/HeadTable.js';
import { HheaTable } from '../table/HheaTable.js';
import { HmtxTable } from '../table/HmtxTable.js';
import { LocaTable } from '../table/LocaTable.js';
import { MaxpTable } from '../table/MaxpTable.js';
import { NameTable } from '../table/NameTable.js';
import { PostTable } from '../table/PostTable.js';
import { Table } from '../table/Table.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { GlyphData } from '../data/GlyphData.js';

export class RawFont {
    // Define properties
    private os2: Os2Table | null = null;
    private cmap: CmapTable | null = null;
    private glyf: GlyfTable | null = null;
    private head: HeadTable | null = null;
    private hhea: HheaTable | null = null;
    private hmtx: HmtxTable | null = null;
    private loca: LocaTable | null = null;
    private maxp: MaxpTable | null = null;
    private pName: NameTable | null = null;
    private post: PostTable | null = null;

    // Table directory and tables
    private tableDir: TableDirectory | null = null;
    private tables: Array<any> = [];

    constructor(byteData: ByteArray) {
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
    private init(byteData: ByteArray): void {
        // Initialize the table directory
        this.tableDir = new TableDirectory(byteData);
        this.tables = [];

        // Load each of the tables
        for (let i = 0; i < this.tableDir.numTables; i++) {
            const tf = new TableFactory();
            const tab = tf.create(this.tableDir.getEntry(i), byteData);
            if (tab !== null) {
                this.tables.push(tab);
            }
        }

        // Get references to the tables
        this.os2 = this.getTable(Table.OS_2) as Os2Table | null;
        this.cmap = this.getTable(Table.cmap) as CmapTable | null;
        this.glyf = this.getTable(Table.glyf) as GlyfTable | null;
        this.head = this.getTable(Table.head) as HeadTable | null;
        this.hhea = this.getTable(Table.hhea) as HheaTable | null;
        this.hmtx = this.getTable(Table.hmtx) as HmtxTable | null;
        this.loca = this.getTable(Table.loca) as LocaTable | null;
        this.maxp = this.getTable(Table.maxp) as MaxpTable | null;
        this.pName = this.getTable(Table.pName) as NameTable | null;
        this.post = this.getTable(Table.post) as PostTable | null;

        // Initialize the tables
        if (this.hmtx && this.maxp) {
            this.hmtx.run(this.hhea?.numberOfHMetrics ?? 0, this.maxp.numGlyphs - (this.hhea?.numberOfHMetrics ?? 0));
        }
        if (this.loca && this.maxp && this.head) {
            this.loca.run(this.maxp.numGlyphs, this.head.indexToLocFormat === 0);
        }
        if (this.glyf && this.loca && this.maxp) {

            // console.log(">>>>>>>>>>>>>>>>>>>>",this.maxp.numGlyphs);

            this.glyf.run(this.maxp.numGlyphs, this.loca);
        }
    }

    // Get a glyph description by index
    public getGlyph(i: number): GlyphData | null {
        const description = this.glyf?.getDescription(i);
        return description != null
            ? new GlyphData(description, this.hmtx?.getLeftSideBearing(i) ?? 0, this.hmtx?.getAdvanceWidth(i) ?? 0)
            : null;
    }

    // Get the number of glyphs
    public getNumGlyphs(): number {
        return this.maxp?.numGlyphs ?? 0;
    }

    // Get the ascent value
    public getAscent(): number {
        return this.hhea?.ascender ?? 0;
    }

    // Get the descent value
    public getDescent(): number {
        return this.hhea?.descender ?? 0;
    }

    // Return a table by type
    private getTable( tableType:any )
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
}


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