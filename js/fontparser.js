/*

 Adamia 3D Engine v0.1
 Copyright (c) 2010 Adam R. Smith
 Licensed under the new BSD License:
 http://www.opensource.org/licenses/bsd-license.php

 Project home: http://code.google.com/p/adamia-3d/

 Date: 01/12/2010
*/
"undefined"==typeof a3d&&(a3d={});
(function(){var a=!1,b=/xyz/.test(function(){})?/\b_super\b/:/.*/;this.Class=function(){};Class.extend=function(c){function d(){!a&&this.init&&this.init.apply(this,arguments)}var e=this.prototype;a=!0;var f=new this;a=!1;for(var g in c)f[g]="function"==typeof c[g]&&"function"==typeof e[g]&&b.test(c[g])?function(a,b){return function(){var c=this._super;this._super=e[a];var d=b.apply(this,arguments);this._super=c;return d}}(g,c[g]):c[g];d.prototype=f;d.constructor=d;d.extend=arguments.callee;return d}})();
a3d.Endian={BIG:0,LITTLE:1};
a3d.ByteArray=Class.extend({data:"",length:0,pos:0,pow:Math.pow,endian:a3d.Endian.BIG,TWOeN23:Math.pow(2,-23),TWOeN52:Math.pow(2,-52),init:function(a,b){this.data=void 0!==a?a:"";if(void 0!==b)this.endian=b;this.length=a.length;var c=b==a3d.Endian.BIG?"BE":"LE",d="readInt32,readInt16,readUInt32,readUInt16,readFloat32,readFloat64".split(","),e;for(e in d)this[d[e]]=this[d[e]+c];c={readUnsignedByte:"readByte",readUnsignedInt:"readUInt32",readFloat:"readFloat32",readDouble:"readFloat64",readShort:"readInt16",
readBoolean:"readBool",readInt:"readInt32",readUnsignedShort:"readUInt16"};for(e in c)this[e]=this[c[e]]},readByte:function(){return this.data.charCodeAt(this.pos++)&255},readBool:function(){return this.data.charCodeAt(this.pos++)&255?!0:!1},readUInt32BE:function(){var a=this.data,b=(this.pos+=4)-4;return(a.charCodeAt(b)&255)<<24|(a.charCodeAt(++b)&255)<<16|(a.charCodeAt(++b)&255)<<8|a.charCodeAt(++b)&255},readInt32BE:function(){var a=this.data,b=(this.pos+=4)-4,a=(a.charCodeAt(b)&255)<<24|(a.charCodeAt(++b)&
255)<<16|(a.charCodeAt(++b)&255)<<8|a.charCodeAt(++b)&255;return 2147483648<=a?a-4294967296:a},readUInt16BE:function(){var a=this.data,b=(this.pos+=2)-2;return(a.charCodeAt(b)&255)<<8|a.charCodeAt(++b)&255},readInt16BE:function(){var a=this.data,b=(this.pos+=2)-2,a=(a.charCodeAt(b)&255)<<8|a.charCodeAt(++b)&255;return 32768<=a?a-65536:a},readFloat32BE:function(){var a=this.data,b=(this.pos+=4)-4,c=a.charCodeAt(b)&255,d=a.charCodeAt(++b)&255,e=a.charCodeAt(++b)&255,b=a.charCodeAt(++b)&255,a=(c<<1&
255|d>>7)-127,d=(d&127)<<16|e<<8|b;return 0==d&&-127==a?0:(1-(c>>7<<1))*(1+this.TWOeN23*d)*this.pow(2,a)},readFloat64BE:function(){var a=this.data,b=(this.pos+=8)-8,c=a.charCodeAt(b)&255,d=a.charCodeAt(++b)&255,e=a.charCodeAt(++b)&255,f=a.charCodeAt(++b)&255,g=a.charCodeAt(++b)&255,h=a.charCodeAt(++b)&255,i=a.charCodeAt(++b)&255,b=a.charCodeAt(++b)&255,a=1-(c>>7<<1),c=(c<<4&2047|d>>4)-1023,d=((d&15)<<16|e<<8|f).toString(2)+(g>>7?"1":"0")+((g&127)<<24|h<<16|i<<8|b).toString(2),d=parseInt(d,2);return 0==
d&&-1023==c?0:a*(1+this.TWOeN52*d)*this.pow(2,c)},readUInt32LE:function(){var a=this.data,b=this.pos+=4;return(a.charCodeAt(--b)&255)<<24|(a.charCodeAt(--b)&255)<<16|(a.charCodeAt(--b)&255)<<8|a.charCodeAt(--b)&255},readInt32LE:function(){var a=this.data,b=this.pos+=4,a=(a.charCodeAt(--b)&255)<<24|(a.charCodeAt(--b)&255)<<16|(a.charCodeAt(--b)&255)<<8|a.charCodeAt(--b)&255;return 2147483648<=a?a-4294967296:a},readUInt16LE:function(){var a=this.data,b=this.pos+=2;return(a.charCodeAt(--b)&255)<<8|a.charCodeAt(--b)&
255},readInt16LE:function(){var a=this.data,b=this.pos+=2,a=(a.charCodeAt(--b)&255)<<8|a.charCodeAt(--b)&255;return 32768<=a?a-65536:a},readFloat32LE:function(){var a=this.data,b=this.pos+=4,c=a.charCodeAt(--b)&255,d=a.charCodeAt(--b)&255,e=a.charCodeAt(--b)&255,b=a.charCodeAt(--b)&255,a=(c<<1&255|d>>7)-127,d=(d&127)<<16|e<<8|b;return 0==d&&-127==a?0:(1-(c>>7<<1))*(1+this.TWOeN23*d)*this.pow(2,a)},readFloat64LE:function(){var a=this.data,b=this.pos+=8,c=a.charCodeAt(--b)&255,d=a.charCodeAt(--b)&255,
e=a.charCodeAt(--b)&255,f=a.charCodeAt(--b)&255,g=a.charCodeAt(--b)&255,h=a.charCodeAt(--b)&255,i=a.charCodeAt(--b)&255,b=a.charCodeAt(--b)&255,a=1-(c>>7<<1),c=(c<<4&2047|d>>4)-1023,d=((d&15)<<16|e<<8|f).toString(2)+(g>>7?"1":"0")+((g&127)<<24|h<<16|i<<8|b).toString(2),d=parseInt(d,2);return 0==d&&-1023==c?0:a*(1+this.TWOeN52*d)*this.pow(2,c)}});RawFont=Class.extend({os2:null,cmap:null,glyf:null,head:null,hhea:null,hmtx:null,loca:null,maxp:null,pName:null,post:null,tableDir:null,tables:null,inc:function(a){var b=document.getElementsByTagName("body").item(0);script=document.createElement("script");script.src=a;script.type="text/javascript";b.appendChild(script)},init:function(a){this.tableDir=new TableDirectory(a);this.tables=[];for(var b=0;b<this.tableDir.numTables;b++)this.tables.push((new TableFactory).create(this.tableDir.getEntry(b),
a));this.os2=this.getTable(Table.OS_2);this.cmap=this.getTable(Table.cmap);this.glyf=this.getTable(Table.glyf);this.head=this.getTable(Table.head);this.hhea=this.getTable(Table.hhea);this.hmtx=this.getTable(Table.hmtx);this.loca=this.getTable(Table.loca);this.maxp=this.getTable(Table.maxp);this.pName=this.getTable(Table.pName);this.post=this.getTable(Table.post);this.hmtx.run(this.hhea.numberOfHMetrics,this.maxp.numGlyphs-this.hhea.numberOfHMetrics);this.loca.run(this.maxp.numGlyphs,0==this.head.indexToLocFormat);
this.glyf.run(this.maxp.numGlyphs,this.loca)},getGlyph:function(a){return null!=this.glyf.getDescription(a)?new GlyphData(this.glyf.getDescription(a),this.hmtx.getLeftSideBearing(a),this.hmtx.getAdvanceWidth(a)):null},getNumGlyphs:function(){return this.maxp.numGlyphs},getAscent:function(){return hhea.ascender()},getDescent:function(){return hhea.descender()},getTable:function(a){for(var b=0;b<this.tables.length;b++)if(null!=this.tables[b]&&this.tables[b].getType()==a)return this.tables[b];return null}});TableDirectory=Class.extend({version:0,numTables:0,searchRange:0,entrySelector:0,rangeShift:0,entries:null,init:function(a){this.version=a.readInt();this.numTables=a.readShort();this.searchRange=a.readShort();this.entrySelector=a.readShort();this.rangeShift=a.readShort();this.entries=[];for(var b=0;b<this.numTables;b++)this.entries.push(new DirectoryEntry(a));for(b=!0;b;){b=!1;for(a=0;a<this.numTables-1;a++)this.entries[a].offset>this.entries[a+1].offset&&(b=this.entries[a],this.entries[a]=this.entries[a+
1],this.entries[a+1]=b,b=!0)}},getEntry:function(a){return this.entries[a]},getEntryByTag:function(a){for(var b=0;b<numTables;b++)if(this.entries[b].tag==a)return this.entries[b];return null}});DirectoryEntry=Class.extend({tag:null,checksum:null,offset:null,length:null,table:null,init:function(a){this.tag=a.readInt();this.checksum=a.readInt();this.offset=a.readInt();this.length=a.readInt()},toString:function(){Integer.toHexString(checksum)}});TableFactory=Class.extend({init:function(){},create:function(a,b){var c=null;switch(a.tag){case Table.GSUB:c=new GsubTable(a,b);break;case Table.OS_2:return new Os2Table(a,b);case Table.cmap:return new CmapTable(a,b);case Table.glyf:return new GlyfTable(a,b);case Table.head:return new HeadTable(a,b);case Table.hhea:return new HheaTable(a,b);case Table.hmtx:return new HmtxTable(a,b);case Table.loca:return new LocaTable(a,b);case Table.maxp:return new MaxpTable(a,b);case Table.pName:return new NameTable(a,
b);case Table.post:return new PostTable(a,b)}return c}});Os2Table=Class.extend({version:0,xAvgCharWidth:0,usWeightClass:0,usWidthClass:0,fsType:0,ySubscriptXSize:0,ySubscriptYSize:0,ySubscriptXOffset:0,ySubscriptYOffset:0,ySuperscriptXSize:0,ySuperscriptYSize:0,ySuperscriptXOffset:0,ySuperscriptYOffset:0,yStrikeoutSize:0,yStrikeoutPosition:0,sFamilyClass:0,panose:null,ulUnicodeRange1:0,ulUnicodeRange2:0,ulUnicodeRange3:0,ulUnicodeRange4:0,achVendorID:0,fsSelection:0,usFirstCharIndex:0,usLastCharIndex:0,sTypoAscender:0,sTypoDescender:0,sTypoLineGap:0,usWinAscent:0,
usWinDescent:0,ulCodePageRange1:0,ulCodePageRange2:0,init:function(a,b){b.pos=a.offset;this.version=b.readUnsignedShort();this.xAvgCharWidth=b.readShort();this.usWeightClass=b.readUnsignedShort();this.usWidthClass=b.readUnsignedShort();this.fsType=b.readShort();this.ySubscriptXSize=b.readShort();this.ySubscriptYSize=b.readShort();this.ySubscriptXOffset=b.readShort();this.ySubscriptYOffset=b.readShort();this.ySuperscriptXSize=b.readShort();this.ySuperscriptYSize=b.readShort();this.ySuperscriptXOffset=
b.readShort();this.ySuperscriptYOffset=b.readShort();this.yStrikeoutSize=b.readShort();this.yStrikeoutPosition=b.readShort();this.sFamilyClass=b.readShort();b.pos=a.offset;for(var c=[],d=0;10>d;d++)c.push(b.readUnsignedByte());this.panose=new Panose(c);this.ulUnicodeRange1=b.readInt();this.ulUnicodeRange2=b.readInt();this.ulUnicodeRange3=b.readInt();this.ulUnicodeRange4=b.readInt();this.achVendorID=b.readInt();this.fsSelection=b.readShort();this.usFirstCharIndex=b.readShort();this.usLastCharIndex=
b.readShort();this.sTypoAscender=b.readShort();this.sTypoDescender=b.readShort();this.sTypoLineGap=b.readShort();this.usWinAscent=b.readShort();this.usWinDescent=b.readShort();this.ulCodePageRange1=b.readInt();this.ulCodePageRange2=b.readInt()},getType:function(){return Table.OS_2}});Panose=Class.extend({bFamilyType:0,bSerifStyle:0,bWeight:0,bProportion:0,bContrast:0,bStrokeVariation:0,bArmStyle:0,bLetterform:0,bMidline:0,bXHeight:0,init:function(a){this.bFamilyType=a[0];this.bSerifStyle=a[1];this.bWeight=a[2];this.bProportion=a[3];this.bContrast=a[4];this.bStrokeVariation=a[5];this.bArmStyle=a[6];this.bLetterform=a[7];this.bMidline=a[8];this.bXHeight=a[9]},toString:function(){var a;a=""+(this.bFamilyType+" ");a+=this.bSerifStyle+" ";a+=this.bWeight+" ";a+=this.bProportion+" ";
a+=this.bContrast+" ";a+=this.bStrokeVariation+" ";a+=this.bArmStyle+" ";a+=this.bLetterform+" ";a+=this.bMidline+" ";return a+=this.bXHeight+" "}});function Table(){}Table.BASE=1111577413;Table.CFF=1128678944;Table.DSIG=1146308935;Table.EBDT=1161970772;Table.EBLC=1161972803;Table.EBSC=1161974595;Table.GDEF=1195656518;Table.GPOS=1196445523;Table.GSUB=1196643650;Table.JSTF=1246975046;Table.LTSH=1280594760;Table.MMFX=1296909912;Table.MMSD=1296913220;Table.OS_2=1330851634;Table.PCLT=1346587732;Table.VDMX=1447316824;Table.cmap=1668112752;Table.cvt=1668707360;Table.fpgm=1718642541;Table.fvar=1719034226;Table.gasp=1734439792;Table.glyf=1735162214;
Table.hdmx=1751412088;Table.head=1751474532;Table.hhea=1751672161;Table.hmtx=1752003704;Table.kern=1801810542;Table.loca=1819239265;Table.maxp=1835104368;Table.pName=1851878757;Table.prep=1886545264;Table.post=1886352244;Table.vhea=1986553185;Table.vmtx=1986884728;Table.platformAppleUnicode=0;Table.platformMacintosh=1;Table.platformISO=2;Table.platformMicrosoft=3;Table.encodingUndefined=0;Table.encodingUGL=1;Table.encodingRoman=0;Table.encodingJapanese=1;Table.encodingChinese=2;
Table.encodingKorean=3;Table.encodingArabic=4;Table.encodingHebrew=5;Table.encodingGreek=6;Table.encodingRussian=7;Table.encodingRSymbol=8;Table.encodingDevanagari=9;Table.encodingGurmukhi=10;Table.encodingGujarati=11;Table.encodingOriya=12;Table.encodingBengali=13;Table.encodingTamil=14;Table.encodingTelugu=15;Table.encodingKannada=16;Table.encodingMalayalam=17;Table.encodingSinhalese=18;Table.encodingBurmese=19;Table.encodingKhmer=20;Table.encodingThai=21;Table.encodingLaotian=22;
Table.encodingGeorgian=23;Table.encodingArmenian=24;Table.encodingMaldivian=25;Table.encodingTibetan=26;Table.encodingMongolian=27;Table.encodingGeez=28;Table.encodingSlavic=29;Table.encodingVietnamese=30;Table.encodingSindhi=31;Table.encodingUnvarerp=32;Table.encodingASCII=0;Table.encodingISO10646=1;Table.encodingISO8859_1=2;Table.languageSQI=1052;Table.languageEUQ=1069;Table.languageBEL=1059;Table.languageBGR=1026;Table.languageCAT=1027;Table.languageSHL=1050;Table.languageCSY=1029;
Table.languageDAN=1030;Table.languageNLD=1043;Table.languageNLB=2067;Table.languageENU=1033;Table.languageENG=2057;Table.languageENA=3081;Table.languageENC=4105;Table.languageENZ=5129;Table.languageENI=6153;Table.languageETI=1061;Table.languageFIN=1035;Table.languageFRA=1036;Table.languageFRB=2060;Table.languageFRC=3084;Table.languageFRS=4108;Table.languageFRL=5132;Table.languageDEU=1031;Table.languageDES=2055;Table.languageDEA=3079;Table.languageDEL=4103;Table.languageDEC=5127;
Table.languageELL=1032;Table.languageHUN=1038;Table.languageISL=1039;Table.languageITA=1040;Table.languageITS=2064;Table.languageLVI=1062;Table.languageLTH=1063;Table.languageNOR=1044;Table.languageNON=2068;Table.languagePLK=1045;Table.languagePTB=1046;Table.languagePTG=2070;Table.languageROM=1048;Table.languageRUS=1049;Table.languageSKY=1051;Table.languageSLV=1060;Table.languageESP=1034;Table.languageESM=2058;Table.languageESN=3082;Table.languageSVE=1053;Table.languageTRK=1055;
Table.languageUKR=1058;Table.languageEnglish=0;Table.languageFrench=1;Table.languageGerman=2;Table.languageItalian=3;Table.languageDutch=4;Table.languageSwedish=5;Table.languageSpanish=6;Table.languageDanish=7;Table.languagePortuguese=8;Table.languageNorwegian=9;Table.languageHebrew=10;Table.languageJapanese=11;Table.languageArabic=12;Table.languageFinnish=13;Table.languageGreek=14;Table.languageIcelandic=15;Table.languageMaltese=16;Table.languageTurkish=17;Table.languageYugoslavian=18;
Table.languageChinese=19;Table.languageUrdu=20;Table.languageHindi=21;Table.languageThai=22;Table.nameCopyrightNotice=0;Table.nameFontFamilyName=1;Table.nameFontSubfamilyName=2;Table.nameUniqueFontIdentifier=3;Table.nameFullFontName=4;Table.nameVersionString=5;Table.namePostscriptName=6;Table.nameTrademark=7;CmapTable=Class.extend({version:0,numTables:0,entries:null,formats:null,init:function(a,b){b.pos=a.offset;var c=b.pos;this.version=b.readUnsignedShort();this.numTables=b.readUnsignedShort();this.entries=[];for(var d=0;d<this.numTables;d++)this.entries.push(new CmapIndexEntry(b));this.formats=[];for(d=0;d<this.numTables;d++){b.pos=c+this.entries[d].offset;var e=b.readUnsignedShort();this.formats.push((new CmapFormat(b)).create(e,b))}},getCmapFormat:function(a,b){for(var c=0;c<this.numTables;c++)if(this.entries[c].platformId==
a&&this.entries[c].encodingId==b)return this.formats[c];return null},getType:function(){return Table.cmap}});GlyfTable=Class.extend({buf:null,descript:null,init:function(a,b){b.pos=a.offset;this.buf=new a3d.ByteArray(b.data.substr(b.pos,a.length),a3d.Endian.BIG)},run:function(a,b){if(null!=this.buf){this.descript=[];for(var c=0;c<a;c++){var d=b.getOffset(c+1)-b.getOffset(c),e=new a3d.ByteArray(this.buf.data.substr(this.buf.pos,this.buf.data.length),a3d.Endian.BIG);this.buf.pos=0;if(0<d)e.pos=0,e.pos=b.getOffset(c),d=0,d=e.readUnsignedByte()<<8|e.readUnsignedByte(),255<d&&(d=-1),0<=d&&this.descript.push(new GlyfSimpleDescript(this,
d,e))}this.buf=null;for(c=0;c<a;c++)null!=this.descript[c]&&this.descript[c].resolve()}},getDescription:function(a){return this.descript[a]},getType:function(){return Table.glyf}});HeadTable=Class.extend({versionNumber:0,fontRevision:0,checkSumAdjustment:0,magicNumber:0,flags:0,unitsPerEm:0,created:0,modified:0,xMin:0,yMin:0,xMax:0,yMax:0,macStyle:0,lowestRecPPEM:0,fontDirectionHint:0,indexToLocFormat:0,glyphDataFormat:0,init:function(a,b){b.pos=a.offset;this.versionNumber=b.readInt();this.fontRevision=b.readInt();this.checkSumAdjustment=b.readInt();this.magicNumber=b.readInt();this.flags=b.readShort();this.unitsPerEm=b.readShort();this.created=this.readLong(b);this.modified=
this.readLong(b);this.xMin=b.readShort();this.yMin=b.readShort();this.xMax=b.readShort();this.yMax=b.readShort();this.macStyle=b.readShort();this.lowestRecPPEM=b.readShort();this.fontDirectionHint=b.readShort();this.indexToLocFormat=b.readShort();this.glyphDataFormat=b.readShort()},readLong:function(a){return a.readUnsignedByte()<<56+a.readUnsignedByte()<<48+a.readUnsignedByte()<<40|a.readUnsignedByte()<<32+a.readUnsignedByte()<<24+a.readUnsignedByte()<<16+a.readUnsignedByte()<<8+a.readUnsignedByte()},
getType:function(){return Table.head}});CmapIndexEntry=Class.extend({platformId:0,encodingId:0,offset:0,init:function(a){this.platformId=a.readUnsignedShort();this.encodingId=a.readShort();this.offset=a.readInt()},toString:function(){}});CmapFormat=Class.extend({format:0,length:0,version:0,init:function(a){this.length=a.readUnsignedShort();this.version=a.readUnsignedShort()},create:function(a,b){switch(a){case 0:return new CmapFormat0(b);case 2:return new CmapFormat2(b);case 4:return new CmapFormat4(b);case 6:return new CmapFormat6(b)}return null},toString:function(){return"format: "+format+", length: "+length+", version: "+version}});CmapFormat0=Class.extend({glyphIdArray:[],first:0,last:0,format:0,length:0,version:0,init:function(a){this.length=a.readUnsignedShort();this.version=a.readUnsignedShort();this.format=0;this.first=-1;for(var b=0;256>b;b++)if(this.glyphIdArray[b]=a.readUnsignedByte(),0<this.glyphIdArray[b]){if(-1==this.first)this.first=b;this.last=b}},getFirst:function(){return this.first},getLast:function(){return this.last},mapCharCode:function(a){return 0<=a&&256>a?this.glyphIdArray[a]:0},toString:function(){return"format: "+
format+", length: "+length+", version: "+version}});CmapFormat2=Class.extend({subHeaderKeys:[],subHeaders1:null,subHeaders2:null,glyphIndexArray:null,format:0,length:0,version:0,init:function(a){this.length=a.readUnsignedShort();this.version=a.readUnsignedShort();this.format=2},getFirst:function(){return 0},getLast:function(){return 0},mapCharCode:function(){return 0},toString:function(){return"format: "+format+", length: "+length+", version: "+version}});CmapFormat4=Class.extend({format:0,length:0,version:0,language:0,segCountX2:0,searchRange:0,entrySelector:0,rangeShift:0,endCode:null,startCode:null,idDelta:null,idRangeOffset:null,glyphIdArray:null,segCount:0,first:0,last:0,init:function(a){this.length=a.readUnsignedShort();this.version=a.readUnsignedShort();this.format=4;this.segCountX2=a.readUnsignedShort();this.segCount=this.segCountX2/2;this.endCode=[];this.startCode=[];this.idDelta=[];this.idRangeOffset=[];this.searchRange=a.readUnsignedShort();
this.entrySelector=a.readUnsignedShort();this.rangeShift=a.readUnsignedShort();this.last=-1;for(var b=0;b<this.segCount;b++)if(this.endCode.push(a.readUnsignedShort()),this.endCode[b]>this.last)this.last=this.endCode[b];a.readUnsignedShort();for(b=0;b<this.segCount;b++)if(this.startCode.push(a.readUnsignedShort()),0==b||this.startCode[b]<this.first)this.first=this.startCode[b];for(b=0;b<this.segCount;b++)this.idDelta.push(a.readUnsignedShort());for(b=0;b<this.segCount;b++)this.idRangeOffset.push(a.readUnsignedShort());
b=(this.length-16-8*this.segCount)/2;this.glyphIdArray=[];for(var c=0;c<b;c++)this.glyphIdArray.push(a.readUnsignedShort())},getFirst:function(){return this.first},getLast:function(){return this.last},mapCharCode:function(a){if(0>a||65534<=a)return 0;for(var b=0;b<this.segCount;b++)if(this.endCode[b]>=a){if(this.startCode[b]<=a)return 0<this.idRangeOffset[b]?this.glyphIdArray[this.idRangeOffset[b]/2+(a-this.startCode[b])-(this.segCount-b)]:(this.idDelta[b]+a)%65536;break}return 0},toString:function(){var a;
return"format: "+format+", length: "+length+", version: "+version+(", segCOuntX2: "+segCountX2+", searchRange: "+searchRange+", entrySelector: "+entrySelector)+(", rangeShift: "+rangeShift+", endCode: "+endCode+", startCode: "+startCode+", idDelta: "+idDelta)+(", idRangeOffset: "+idRangeOffset)}});CmapFormat6=Class.extend({format:0,length:0,version:0,firstCode:0,entryCount:0,glyphIdArray:null,init:function(a){this.length=a.readUnsignedShort();this.version=a.readUnsignedShort();this.format=6},getFirst:function(){return 0},getLast:function(){return 0},mapCharCode:function(){return 0},toString:function(){return"format: "+format+", length: "+length+", version: "+version}});HheaTable=Class.extend({version:0,ascender:0,descender:0,lineGap:0,advanceWidthMax:0,minLeftSideBearing:0,minRightSideBearing:0,xMaxExtent:0,caretSlopeRise:0,caretSlopeRun:0,metricDataFormat:0,numberOfHMetrics:0,init:function(a,b){b.pos=a.offset;this.version=b.readInt();this.ascender=b.readShort();this.descender=b.readShort();this.lineGap=b.readShort();this.advanceWidthMax=b.readShort();this.minLeftSideBearing=b.readShort();this.minRightSideBearing=b.readShort();this.xMaxExtent=b.readShort();this.caretSlopeRise=
b.readShort();this.caretSlopeRun=b.readShort();for(var c=0;5>c;c++)b.readShort();this.metricDataFormat=b.readShort();this.numberOfHMetrics=b.readUnsignedShort()},getType:function(){return Table.hhea}});HmtxTable=Class.extend({buf:null,hMetrics:null,leftSideBearing:null,init:function(a,b){b.pos=a.offset;this.buf=new a3d.ByteArray(b.data,a3d.Endian.BIG)},run:function(a,b){if(null!=this.buf){this.hMetrics=[];for(var c=0;c<a;c++)this.hMetrics.push(this.buf.readUnsignedByte()<<24|this.buf.readUnsignedByte()<<16|this.buf.readUnsignedByte()<<8|this.buf.readUnsignedByte());if(0<b){this.leftSideBearing=[];for(c=0;c<b;c++)this.leftSideBearing.push(this.buf.readUnsignedByte()<<8|this.buf.readUnsignedByte())}this.buf=
null}},getAdvanceWidth:function(a){return null==this.hMetrics?0:a<this.hMetrics.length?this.hMetrics[a]>>16:this.hMetrics[this.hMetrics.length-1]>>16},getLeftSideBearing:function(a){return null==this.hMetrics?0:a<this.hMetrics.length?this.hMetrics[a]:this.leftSideBearing[a-this.hMetrics.length]},getType:function(){return Table.hmtx}});LocaTable=Class.extend({buf:null,offsets:null,factor:0,init:function(a,b){b.pos=a.offset;this.buf=new a3d.ByteArray(b.data.substr(b.pos,a.length),a3d.Endian.BIG)},run:function(a,b){if(null!=this.buf){this.offsets=[];if(b){this.factor=2;for(var c=0;c<=a;c++)this.offsets.push(this.buf.readUnsignedByte()<<8|this.buf.readUnsignedByte())}else{this.factor=1;for(c=0;c<=a;c++)this.offsets[c]=this.buf.readUnsignedByte()<<24|this.buf.readUnsignedByte()<<16|this.buf.readUnsignedByte()<<8|this.buf.readUnsignedByte()}this.buf=
null}},getOffset:function(a){return null==this.offsets?0:this.offsets[a]*this.factor},getType:function(){return Table.loca}});NameTable=Class.extend({formatSelector:0,numberOfNameRecords:0,stringStorageOffset:0,records:null,init:function(a,b){b.pos=a.offset;this.formatSelector=b.readShort();this.numberOfNameRecords=b.readShort();this.stringStorageOffset=b.readShort();this.records=[];for(var c=0;c<this.numberOfNameRecords;c++)this.records.push(new NameRecord(b));for(c=0;c<this.numberOfNameRecords;c++)this.records[c].loadString(b,a.offset+this.stringStorageOffset)},getRecord:function(a){for(var b=0;b<this.numberOfNameRecords;b++)if(this.records[b].nameId==
a)return this.records[b].record;return""},getType:function(){return Table.pName}});NameRecord=Class.extend({platformId:0,encodingId:0,languageId:0,nameId:0,stringLength:0,stringOffset:0,record:"",init:function(a){this.platformId=a.readShort();this.encodingId=a.readShort();this.languageId=a.readShort();this.nameId=a.readShort();this.stringLength=a.readShort();this.stringOffset=a.readShort()},loadString:function(a,b){var c="";a.position=b+this.stringOffset;if(this.platformId==Table.platformAppleUnicode)for(var d=0;d<this.stringLength/2;d++)c+=a.readUnsignedByte(),c+=a.readUnsignedByte();
else if(this.platformId==Table.platformMacintosh)c+=a.readUnsignedByte();else if(this.platformId==Table.platformISO)c+=a.readUnsignedByte();else if(this.platformId==Table.platformMicrosoft)for(d=0;d<this.stringLength/2;d++)c+=a.readUnsignedByte(),c+=a.readUnsignedByte();this.record=c}});MaxpTable=Class.extend({versionNumber:0,numGlyphs:0,maxPoints:0,maxContours:0,maxCompositePoints:0,maxCompositeContours:0,maxZones:0,maxTwilightPoints:0,maxStorage:0,maxFunctionDefs:0,maxInstructionDefs:0,maxStackElements:0,maxSizeOfInstructions:0,maxComponentElements:0,maxComponentDepth:0,init:function(a,b){b.pos=a.offset;this.versionNumber=b.readInt();this.numGlyphs=b.readUnsignedShort();this.maxPoints=b.readUnsignedShort();this.maxContours=b.readUnsignedShort();this.maxCompositePoints=b.readUnsignedShort();
this.maxCompositeContours=b.readUnsignedShort();this.maxZones=b.readUnsignedShort();this.maxTwilightPoints=b.readUnsignedShort();this.maxStorage=b.readUnsignedShort();this.maxFunctionDefs=b.readUnsignedShort();this.maxInstructionDefs=b.readUnsignedShort();this.maxStackElements=b.readUnsignedShort();this.maxSizeOfInstructions=b.readUnsignedShort();this.maxComponentElements=b.readUnsignedShort();this.maxComponentDepth=b.readUnsignedShort()},getType:function(){return Table.maxp}});PostTable=Class.extend({macGlyphName:".notdef,null,CR,space,exclam,quotedbl,numbersign,dollar,percent,ampersand,quotesingle,parenleft,parenright,asterisk,plus,comma,hyphen,period,slash,zero,one,two,three,four,five,six,seven,eight,nine,colon,semicolon,less,equal,greater,question,at,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,bracketleft,backslash,bracketright,asciicircum,underscore,grave,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,braceleft,bar,braceright,asciitilde,Adieresis,Aring,Ccedilla,Eacute,Ntilde,Odieresis,Udieresis,aacute,agrave,acircumflex,adieresis,atilde,aring,ccedilla,eacute,egrave,ecircumflex,edieresis,iacute,igrave,icircumflex,idieresis,ntilde,oacute,ograve,ocircumflex,odieresis,otilde,uacute,ugrave,ucircumflex,udieresis,dagger,degree,cent,sterling,section,bullet,paragraph,germandbls,registered,copyright,trademark,acute,dieresis,notequal,AE,Oslash,infinity,plusminus,lessequal,greaterequal,yen,mu,partialdiff,summation,product,pi,integral',ordfeminine,ordmasculine,Omega,ae,oslash,questiondown,exclamdown,logicalnot,radical,florin,approxequal,increment,guillemotleft,guillemotright,ellipsis,nbspace,Agrave,Atilde,Otilde,OE,oe,endash,emdash,quotedblleft,quotedblright,quoteleft,quoteright,divide,lozenge,ydieresis,Ydieresis,fraction,currency,guilsinglleft,guilsinglright,fi,fl,daggerdbl,middot,quotesinglbase,quotedblbase,perthousand,Acircumflex,Ecircumflex,Aacute,Edieresis,Egrave,Iacute,Icircumflex,Idieresis,Igrave,Oacute,Ocircumflex,,Ograve,Uacute,Ucircumflex,Ugrave,dotlessi,circumflex,tilde,overscore,breve,dotaccent,ring,cedilla,hungarumlaut,ogonek,caron,Lslash,lslash,Scaron,scaron,Zcaron,zcaron,brokenbar,Eth,eth,Yacute,yacute,Thorn,thorn,minus,multiply,onesuperior,twosuperior,threesuperior,onehalf,onequarter,threequarters,franc,Gbreve,gbreve,Idot,Scedilla,scedilla,Cacute,cacute,Ccaron,ccaron,".split(","),
version:0,italicAngle:0,underlinePosition:0,underlineThickness:0,isFixedPitch:0,minMemType42:0,maxMemType42:0,minMemType1:0,maxMemType1:0,numGlyphs:0,glyphNameIndex:null,psGlyphName:null,init:function(a,b){b.pos=a.offset;this.version=b.readInt();this.italicAngle=b.readInt();this.underlinePosition=b.readShort();this.underlineThickness=b.readShort();this.isFixedPitch=b.readInt();this.minMemType42=b.readInt();this.maxMemType42=b.readInt();this.minMemType1=b.readInt();this.maxMemType1=b.readInt();if(131072==
this.version){this.numGlyphs=b.readUnsignedShort();this.glyphNameIndex=[];for(var c=0;c<this.numGlyphs;c++)this.glyphNameIndex.push(b.readUnsignedShort());c=this.highestGlyphNameIndex();if(257<c){c-=257;this.psGlyphName=[];for(var d=0;d<c;d++){var e=b.readUnsignedByte(),f=new a3d.ByteArray(b.data.substr(b.pos,e),a3d.Endian.BIG);b.pos+=e;this.psGlyphName.push(f.data)}}}},highestGlyphNameIndex:function(){for(var a=0,b=0;b<this.numGlyphs;b++)a<this.glyphNameIndex[b]&&(a=this.glyphNameIndex[b]);return a},
getGlyphName:function(a){return 131072==this.version?257<this.glyphNameIndex[a]?this.psGlyphName[this.glyphNameIndex[a]-258]:this.macGlyphName[this.glyphNameIndex[a]]:null},getType:function(){return Table.post}});GsubTable=Class.extend({scriptList:0,featureList:0,lookupList:0,init:function(a,b){b.pos=a.offset;b.readInt();var c=b.readUnsignedShort(),d=b.readUnsignedShort(),e=b.readUnsignedShort();this.scriptList=new ScriptList(b,a.offset+c);this.featureList=new FeatureList(b,a.offset+d);this.lookupList=new LookupList(b,a.offset+e,this)},read:function(a,b,c){var d=null;switch(a){case 1:d=SingleSubst.read(b,c);break;case 4:d=LigatureSubst.read(b,c)}return d},getType:function(){return Table.GSUB}});GlyfSimpleDescript=Class.extend({instructions:null,onCurve:1,xShortVector:2,yShortVector:4,repeat:8,xDual:16,yDual:32,parentTable:null,numberOfContours:0,xMin:0,yMin:0,xMax:0,yMax:0,endPtsOfContours:null,flags:null,xCoordinates:null,yCoordinates:null,count:0,init:function(a,b,c){this.parentTable=a;this.numberOfContours=b;this.xMin=c.readUnsignedByte()<<8|c.readUnsignedByte();this.yMin=c.readUnsignedByte()<<8|c.readUnsignedByte();this.xMax=c.readUnsignedByte()<<8|c.readUnsignedByte();this.yMax=c.readUnsignedByte()<<
8|c.readUnsignedByte();this.endPtsOfContours=[];for(a=0;a<this.numberOfContours;a++)this.endPtsOfContours.push(c.readUnsignedByte()<<8|c.readUnsignedByte());this.count=this.endPtsOfContours[b-1]+1;this.flags=[];this.xCoordinates=[];this.yCoordinates=[];b=c.readUnsignedByte()<<8|c.readUnsignedByte();this.readInstructions(c,b);this.readFlags(this.count,c);this.readCoords(this.count,c)},readInstructions:function(a,b){this.instructions=[];for(var c=0;c<b;c++)this.instructions.push(a.readUnsignedByte())},
getEndPtOfContours:function(a){return this.endPtsOfContours[a]},getFlags:function(a){return this.flags[a]},getXCoordinate:function(a){return this.xCoordinates[a]},getYCoordinate:function(a){return this.yCoordinates[a]},isComposite:function(){return!1},getPointCount:function(){return this.count},getContourCount:function(){return this.getNumberOfContours()},readCoords:function(a,b){for(var c=0,d=0,e=0;e<a;e++){if(0!=(this.flags[e]&this.xDual))0!=(this.flags[e]&this.xShortVector)&&(c+=b.readUnsignedByte());
else if(0!=(this.flags[e]&this.xShortVector))c+=-b.readUnsignedByte();else{var f=b.readUnsignedByte()<<8|b.readUnsignedByte();6E4<f?(f=65536-f,c-=f):c+=f}this.xCoordinates.push(c)}for(c=0;c<a;c++)0!=(this.flags[c]&this.yDual)?0!=(this.flags[c]&this.yShortVector)&&(d+=b.readUnsignedByte()):0!=(this.flags[c]&this.yShortVector)?d+=-b.readUnsignedByte():(e=b.readUnsignedByte()<<8|b.readUnsignedByte(),6E4<e?(e=65536-e,d-=e):d+=e),this.yCoordinates.push(d)},readFlags:function(a,b){for(var c=0;c<a;c++)if(this.flags.push(b.readUnsignedByte()),
0!=(this.flags[c]&this.repeat)){for(var d=b.readUnsignedByte(),e=1;e<=d;e++)this.flags[c+e]=this.flags[c];c+=d}},resolve:function(){}});GlyfCompositeDescript=Class.extend({instructions:null,onCurve:1,xShortVector:2,yShortVector:4,repeat:8,xDual:16,yDual:32,parentTable:null,numberOfContours:0,xMin:0,yMin:0,xMax:0,yMax:0,components:[],beingResolved:!1,resolved:!1,init:function(a,b){this.parentTable=a;this.numberOfContours=-1;this.xMin=b.readUnsignedByte()<<8|b.readUnsignedByte();this.yMin=b.readUnsignedByte()<<8|b.readUnsignedByte();this.xMax=b.readUnsignedByte()<<8|b.readUnsignedByte();this.yMax=b.readUnsignedByte()<<8|b.readUnsignedByte();
var c;do c=new GlyfCompositeComp(b),this.components.push(c);while(0!=(c.flags&GlyfCompositeComp.MORE_COMPONENTS));0!=(c.flags&GlyfCompositeComp.WE_HAVE_INSTRUCTIONS)&&this.readInstructions(b,b.readUnsignedByte()<<8|b.readUnsignedByte())},readInstructions:function(a,b){this.instructions=[];for(var c=0;c<b;c++)this.instructions.push(a.readUnsignedByte())},resolve:function(){if(!this.resolved&&!this.beingResolved){this.beingResolved=!0;for(var a=0,b=0,c=0;c<this.components.length;c++){var d=this.components[c];
d.firstIndex=a;d.firstContour=b;d=this.parentTable.getDescription(d.glyphIndex);null!=d&&(d.resolve(),a+=d.count,b+=d.numberOfContours)}this.resolved=!0;this.beingResolved=!1}},getEndPtOfContours:function(a){var b=getCompositeCompEndPt(a);return null!=b?this.parentTable.getDescription(b.getGlyphIndex()).getEndPtOfContours(a-b.getFirstContour())+b.getFirstIndex():0},getFlags:function(a){var b=getCompositeComp(a);return null!=b?this.parentTable.getDescription(b.getGlyphIndex()).getFlags(a-b.getFirstIndex()):
0},getXCoordinate:function(a){var b=getCompositeComp(a);if(null!=b){var c=this.parentTable.getDescription(b.getGlyphIndex()),d=a-b.getFirstIndex(),a=c.getXCoordinate(d),c=c.getYCoordinate(d),c=b.scaleX(a,c);return c+=b.getXTranslate()}return 0},getYCoordinate:function(a){var b=getCompositeComp(a);if(null!=b){var c=this.parentTable.getDescription(b.getGlyphIndex()),d=a-b.getFirstIndex(),a=c.getXCoordinate(d),c=c.getYCoordinate(d),c=b.scaleY(a,c);return c+=b.getYTranslate()}return 0},isComposite:function(){return!0},
getPointCount:function(){this.resolved||alert("getPointCount called on unresolved GlyfCompositeDescript");var a=GlyfCompositeComp(this.components[this.components.length-1]);return a.getFirstIndex()+this.parentTable.getDescription(a.getGlyphIndex()).getPointCount()},getContourCount:function(){this.resolved||alert("getContourCount called on unresolved GlyfCompositeDescript");var a=GlyfCompositeComp(this.components[this.components.length-1]);return a.getFirstContour()+this.parentTable.getDescription(a.getGlyphIndex()).getContourCount()},
getComponentIndex:function(a){return this.components[a].getFirstIndex()},getComponentCount:function(){return this.components.length()},getCompositeComp:function(a){for(var b,c=0;c<this.components.length;c++){b=components[c];var d=this.parentTable.getDescription(b.getGlyphIndex());if(b.getFirstIndex()<=a&&a<b.getFirstIndex()+d.getPointCount())return b}return null},getCompositeCompEndPt:function(a){for(var b,c=0;c<this.components.length;c++){b=this.components[c];var d=this.parentTable.getDescription(b.getGlyphIndex());
if(b.getFirstContour()<=a&&a<b.getFirstContour()+d.getContourCount())return b}return null}});Script=Class.extend({defaultLangSysOffset:0,langSysCount:0,langSysRecords:null,defaultLangSys:null,langSys:null,init:function(a,b){a.pos=b;this.defaultLangSysOffset=a.readUnsignedShort();this.langSysCount=a.readUnsignedShort();if(0<this.langSysCount){this.langSysRecords=new LangSysRecord[this.langSysCount];for(var c=0;c<this.langSysCount;c++)this.langSysRecords[c]=new LangSysRecord(a)}if(0<this.langSysCount){this.langSys=new LangSys[this.langSysCount];for(c=0;c<this.langSysCount;c++)a.pos=b+this.langSysRecords[c].getOffset(),
this.langSys[c]=new LangSys(a)}if(0<this.defaultLangSysOffset)a.pos=b+this.defaultLangSysOffset,this.defaultLangSys=new LangSys(a)}});ScriptRecord=Class.extend({tag:0,offset:0,init:function(a){this.tag=a.readInt();this.offset=a.readUnsignedShort()}});Point=Class.extend({x:0,y:0,onCurve:!0,endOfContour:!1,touched:!1,init:function(a,b,c,d){this.x=a;this.y=b;this.onCurve=c;this.endOfContour=d}});GlyphData=Class.extend({leftSideBearing:0,advanceWidth:0,points:null,init:function(a,b,c){this.leftSideBearing=b;this.advanceWidth=c;this.describe(a)},getPoint:function(a){return this.points[a]},getPointCount:function(){return this.points.length},reset:function(){},scale:function(a){for(var b=0;b<this.points.length;b++)this.points[b].x=(this.points[b].x<<10)*a>>26,this.points[b].y=(this.points[b].y<<10)*a>>26;this.leftSideBearing=this.leftSideBearing*a>>6;this.advanceWidth=this.advanceWidth*a>>6},
describe:function(a){var b=0;this.points=[];for(var c=0;c<a.getPointCount();c++){var d=a.getEndPtOfContours(b)==c;d&&b++;this.points.push(new Point(a.getXCoordinate(c),a.getYCoordinate(c),0!=(a.getFlags(c)&1),d))}this.points[a.pointCount]=new Point(0,0,!0,!0);this.points[a.pointCount+1]=new Point(this.advanceWidth,0,!0,!0)}});GlyfCompositeComp=Class.extend({ARG_1_AND_2_ARE_WORDS:1,ARGS_ARE_XY_VALUES:2,ROUND_XY_TO_GRID:4,WE_HAVE_A_SCALE:8,MORE_COMPONENTS:32,WE_HAVE_AN_X_AND_Y_SCALE:64,WE_HAVE_A_TWO_BY_TWO:Number=128,WE_HAVE_INSTRUCTIONS:Number=256,USE_MY_METRICS:Number=512,firstIndex:0,firstContour:0,argument1:0,argument2:0,flags:0,glyphIndex:0,xscale:1,yscale:1,scale01:0,scale10:0,xtranslate:0,ytranslate:0,point1:0,point2:0,init:function(a){this.flags=a.readUnsignedByte()<<8|a.readUnsignedByte();this.glyphIndex=a.readUnsignedByte()<<
8|a.readUnsignedByte();0!=(this.flags&this.ARG_1_AND_2_ARE_WORDS)?(this.argument1=a.readUnsignedByte()<<8|a.readUnsignedByte(),this.argument2=a.readUnsignedByte()<<8|a.readUnsignedByte()):(this.argument1=a.readUnsignedByte(),this.argument2=a.readUnsignedByte());0!=(this.flags&this.ARGS_ARE_XY_VALUES)?(this.xtranslate=this.argument1,this.ytranslate=this.argument2):(this.point1=this.argument1,this.point2=this.argument2);if(0!=(this.flags&this.WE_HAVE_A_SCALE)){var b=a.readUnsignedByte()<<8|a.readUnsignedByte();
this.xscale=this.yscale=b/16384}else if(0!=(this.flags&this.WE_HAVE_AN_X_AND_Y_SCALE))b=a.readUnsignedByte()<<8|a.readUnsignedByte(),this.xscale=b/16384,b=a.readUnsignedByte()<<8|a.readUnsignedByte(),this.yscale=b/16384;else if(0!=(this.flags&this.WE_HAVE_A_TWO_BY_TWO))this.xscale=(a.readUnsignedByte()<<8|a.readUnsignedByte())/16384,a.readUnsignedByte(),a.readUnsignedByte(),this.scale01=b/16384,a.readUnsignedByte(),a.readUnsignedByte(),this.scale10=b/16384,a.readUnsignedByte(),a.readUnsignedByte(),
this.yscale=b/16384},scaleX:function(a,b){return Math.round(a*this.xscale+b*this.scale10)},scaleY:function(a,b){return Math.round(Number(a*this.scale01+b*this.yscale))}});