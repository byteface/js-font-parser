import { Table } from './Table.js';
import { GsubTable } from './GsubTable.js';
import { GposTable } from './GposTable.js';
import { GdefTable } from './GdefTable.js';
import { CvtTable } from './CvtTable.js';
import { FpgmTable } from './FpgmTable.js';
import { Os2Table } from './Os2Table.js';
import { CmapTable } from './CmapTable.js';
import { GlyfTable } from './GlyfTable.js';
import { KernTable } from './KernTable.js';
import { CffTable } from './CffTable.js';
import { Cff2Table } from './Cff2Table.js';
import { HeadTable } from './HeadTable.js';
import { HheaTable } from './HheaTable.js';
import { HmtxTable } from './HmtxTable.js';
import { LocaTable } from './LocaTable.js';
import { MaxpTable } from './MaxpTable.js';
import { NameTable } from './NameTable.js';
import { PostTable } from './PostTable.js';
import { CpalTable } from './CpalTable.js';
import { ColrTable } from './ColrTable.js';
import { SvgTable } from './SvgTable.js';
import { FvarTable } from './FvarTable.js';
import { GvarTable } from './GvarTable.js';
import { PrepTable } from './PrepTable.js';
import { RawTable } from './RawTable.js';
var TableFactory = /** @class */ (function () {
    function TableFactory() {
    }
    TableFactory.prototype.create = function (de, byte_ar) {
        var t = null;
        switch (de.tag) {
            case Table.GSUB:
                return new GsubTable(de, byte_ar);
            case Table.GPOS:
                return new GposTable(de, byte_ar);
            case Table.GDEF:
                return new GdefTable(de, byte_ar);
            case Table.BASE:
                return new RawTable(Table.BASE, de, byte_ar);
            case Table.OS_2:
                return new Os2Table(de, byte_ar);
            case Table.DSIG:
                return new RawTable(Table.DSIG, de, byte_ar);
            case Table.EBDT:
                return new RawTable(Table.EBDT, de, byte_ar);
            case Table.EBLC:
                return new RawTable(Table.EBLC, de, byte_ar);
            case Table.EBSC:
                return new RawTable(Table.EBSC, de, byte_ar);
            case Table.JSTF:
                return new RawTable(Table.JSTF, de, byte_ar);
            case Table.LTSH:
                return new RawTable(Table.LTSH, de, byte_ar);
            case Table.MMFX:
                return new RawTable(Table.MMFX, de, byte_ar);
            case Table.MMSD:
                return new RawTable(Table.MMSD, de, byte_ar);
            case Table.PCLT:
                return new RawTable(Table.PCLT, de, byte_ar);
            case Table.VDMX:
                return new RawTable(Table.VDMX, de, byte_ar);
            case Table.cmap:
                return new CmapTable(de, byte_ar);
            case Table.cvt:
                return new CvtTable(de, byte_ar);
            case Table.fpgm:
                return new FpgmTable(de, byte_ar);
            case Table.gasp:
                return new RawTable(Table.gasp, de, byte_ar);
            case Table.glyf:
                return new GlyfTable(de, byte_ar);
            case Table.CFF:
                return new CffTable(de, byte_ar);
            case Table.CFF2:
                return new Cff2Table(de, byte_ar);
            case Table.hdmx:
                return new RawTable(Table.hdmx, de, byte_ar);
            case Table.head:
                return new HeadTable(de, byte_ar);
            case Table.hhea:
                return new HheaTable(de, byte_ar);
            case Table.hmtx:
                return new HmtxTable(de, byte_ar);
            case Table.kern:
                return new KernTable(de, byte_ar);
            case Table.loca:
                return new LocaTable(de, byte_ar);
            case Table.maxp:
                return new MaxpTable(de, byte_ar);
            case Table.pName:
                return new NameTable(de, byte_ar);
            case Table.prep:
                return new PrepTable(de, byte_ar);
            case Table.post:
                return new PostTable(de, byte_ar);
            case Table.vhea:
                return new RawTable(Table.vhea, de, byte_ar);
            case Table.vmtx:
                return new RawTable(Table.vmtx, de, byte_ar);
            case Table.CPAL:
                return new CpalTable(de, byte_ar);
            case Table.COLR:
                return new ColrTable(de, byte_ar);
            case Table.SVG:
                return new SvgTable(de, byte_ar);
            case Table.fvar:
                return new FvarTable(de, byte_ar);
            case Table.gvar:
                return new GvarTable(de, byte_ar);
            default:
                return t;
        }
    };
    return TableFactory;
}());
export { TableFactory };
/*


TableFactory = Class.extend({
    
    init: function()
    {
    }
    
    , create: function( de, byte_ar )
    {
        var t = null;

        switch ( de.tag )
        {

            // case Table.BASE:
            //     break;
            // case Table.CFF:
            //     break;
            // case Table.DSIG:
            //     break;
            // case Table.EBDT:
            //     break;
            // case Table.EBLC:
            //     break;
            // case Table.EBSC:
            //     break;
            // case Table.GDEF:
            //     break;
            // case Table.GPOS: t = new GposTable(de, byte_ar);
            //     break;

            case Table.GSUB: t = new GsubTable(de, byte_ar);
                break;

            // case Table.JSTF:
            //     break;
            // case Table.LTSH:
            //     break;
            // case Table.MMFX:
            //     break;
            // case Table.MMSD:
            //     break;
            
            case Table.OS_2 : return new Os2Table( de, byte_ar );
                break;
    
            // case Table.PCLT:
            //     break;
            // case Table.VDMX:
            //     break;

            case Table.cmap: return new CmapTable( de, byte_ar );
                break;
                
            // case Table.cvt: t = new CvtTable(de, byte_ar);
            //     break;
            // case Table.fpgm: t = new FpgmTable(de, byte_ar);
            //     break;
            // case Table.fvar:
            //     break;
            // case Table.gasp:
            //     break;
                
            case Table.glyf: return new GlyfTable(de, byte_ar);
                break;
                
            // case Table.hdmx:
            //     break;
                
            case Table.head: return new HeadTable(de, byte_ar);
                break;
            case Table.hhea: return new HheaTable(de, byte_ar);
                break;
            case Table.hmtx: return new HmtxTable(de, byte_ar);
                break;
            //case Table.kern: t = new KernTable(de, byte_ar);
          //      break;
            case Table.loca: return new LocaTable(de, byte_ar);
                break;
            case Table.maxp: return new MaxpTable(de, byte_ar);
                break;
            case Table.pName: return new NameTable(de, byte_ar);
                break;
                
            // case Table.prep: t = new PrepTable(de, byte_ar);
            //     break;

            case Table.post: return new PostTable(de, byte_ar);
                break;

            // case Table.vhea:
            //     break;
            // case Table.vmtx:
            //     break;
                
        }
        return t;
    }
    
});
*/
