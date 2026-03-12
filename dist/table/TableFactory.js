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
import { AvarTable } from './AvarTable.js';
import { BaseAxisTable } from './BaseAxisTable.js';
import { DsigTable } from './DsigTable.js';
import { GaspTable } from './GaspTable.js';
import { HdmxTable } from './HdmxTable.js';
import { HvarTable } from './HvarTable.js';
import { JstfTable } from './JstfTable.js';
import { LtshTable } from './LtshTable.js';
import { MvarTable } from './MvarTable.js';
import { PcltTable } from './PcltTable.js';
import { StatTable } from './StatTable.js';
import { VdmxTable } from './VdmxTable.js';
import { VheaTable } from './VheaTable.js';
import { VvarTable } from './VvarTable.js';
import { VmtxTable } from './VmtxTable.js';
export class TableFactory {
    constructor() { }
    create(de, byte_ar) {
        let t = null;
        switch (de.tag) {
            case Table.GSUB:
                return new GsubTable(de, byte_ar);
            case Table.GPOS:
                return new GposTable(de, byte_ar);
            case Table.GDEF:
                return new GdefTable(de, byte_ar);
            case Table.BASE:
                return new BaseAxisTable(de, byte_ar);
            case Table.OS_2:
                return new Os2Table(de, byte_ar);
            case Table.DSIG:
                return new DsigTable(de, byte_ar);
            case Table.CBDT:
                return new RawTable(Table.CBDT, de, byte_ar);
            case Table.CBLC:
                return new RawTable(Table.CBLC, de, byte_ar);
            case Table.EBDT:
                return new RawTable(Table.EBDT, de, byte_ar);
            case Table.EBLC:
                return new RawTable(Table.EBLC, de, byte_ar);
            case Table.EBSC:
                return new RawTable(Table.EBSC, de, byte_ar);
            case Table.JSTF:
                return new JstfTable(de, byte_ar);
            case Table.LTSH:
                return new LtshTable(de, byte_ar);
            case Table.MMFX:
                return new RawTable(Table.MMFX, de, byte_ar);
            case Table.MMSD:
                return new RawTable(Table.MMSD, de, byte_ar);
            case Table.PCLT:
                return new PcltTable(de, byte_ar);
            case Table.VDMX:
                return new VdmxTable(de, byte_ar);
            case Table.cmap:
                return new CmapTable(de, byte_ar);
            case Table.cvt:
                return new CvtTable(de, byte_ar);
            case Table.fpgm:
                return new FpgmTable(de, byte_ar);
            case Table.gasp:
                return new GaspTable(de, byte_ar);
            case Table.glyf:
                return new GlyfTable(de, byte_ar);
            case Table.CFF:
                return new CffTable(de, byte_ar);
            case Table.CFF2:
                return new Cff2Table(de, byte_ar);
            case Table.hdmx:
                return new HdmxTable(de, byte_ar);
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
            case Table.sbix:
                return new RawTable(Table.sbix, de, byte_ar);
            case Table.vhea:
                return new VheaTable(de, byte_ar);
            case Table.vmtx:
                return new VmtxTable(de, byte_ar);
            case Table.CPAL:
                return new CpalTable(de, byte_ar);
            case Table.COLR:
                return new ColrTable(de, byte_ar);
            case Table.SVG:
                return new SvgTable(de, byte_ar);
            case Table.avar:
                return new AvarTable(de, byte_ar);
            case Table.fvar:
                return new FvarTable(de, byte_ar);
            case Table.gvar:
                return new GvarTable(de, byte_ar);
            case Table.HVAR:
                return new HvarTable(de, byte_ar);
            case Table.VVAR:
                return new VvarTable(de, byte_ar);
            case Table.MVAR:
                return new MvarTable(de, byte_ar);
            case Table.STAT:
                return new StatTable(de, byte_ar);
            default:
                return t;
        }
    }
}
