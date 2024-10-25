var js_includer = function(path){
  document.write('<script language="javascript" type="text/javascript" src="' + path + '"></script>');
}

var js_module_includer = function(path){
  document.write('<script type="module" language="javascript" type="text/javascript" src="' + path + '"></script>');
}


js_includer("js/pottis.js");

// js_includer("com/byteface/font/utils/BinaryParser.js");
js_module_includer("dist/utils/ByteArray.js");

// js_includer("com/byteface/font/data/RawFont.js");
js_module_includer("dist/data/RawFont.js");

// js_includer("com/byteface/font/table/TableDirectory.js");
js_module_includer("dist/table/TableDirectory.js");

// js_includer("com/byteface/font/table/DirectoryEntry.js");
js_module_includer("dist/table/DirectoryEntry.js");

// js_includer("com/byteface/font/table/TableFactory.js");
js_module_includer("dist/table/TableFactory.js");

// js_includer("com/byteface/font/table/Os2Table.js");
js_module_includer("dist/table/Os2Table.js");

// js_includer("com/byteface/font/table/Panose.js");    
js_module_includer("dist/table/Panose.js");

// js_includer("com/byteface/font/table/Table.js");
js_module_includer("dist/table/Table.js");

// js_includer("com/byteface/font/table/CmapTable.js");
js_module_includer("dist/table/CmapTable.js");

// js_includer("com/byteface/font/table/GlyfTable.js");
js_module_includer("dist/table/GlyfTable.js");

// js_includer("com/byteface/font/table/HeadTable.js");
js_module_includer("dist/table/HeadTable.js");

// js_includer("com/byteface/font/table/CmapIndexEntry.js");
js_module_includer("dist/table/CmapIndexEntry.js");

// js_includer("com/byteface/font/table/CmapFormat.js");
js_module_includer("dist/table/CmapFormat.js");

// js_includer("com/byteface/font/table/CmapFormat0.js");
js_module_includer("dist/table/CmapFormat0.js");

// js_includer("com/byteface/font/table/CmapFormat2.js");
js_module_includer("dist/table/CmapFormat2.js");

// js_includer("com/byteface/font/table/CmapFormat4.js");
js_module_includer("dist/table/CmapFormat4.js");

// js_includer("com/byteface/font/table/CmapFormat6.js");
js_module_includer("dist/table/CmapFormat6.js");

// js_includer("com/byteface/font/table/HheaTable.js");
js_module_includer("dist/table/HheaTable.js");

// js_includer("com/byteface/font/table/HmtxTable.js");
js_module_includer("dist/table/HmtxTable.js");

// js_includer("com/byteface/font/table/LocaTable.js");
js_module_includer("dist/table/LocaTable.js");

// js_includer("com/byteface/font/table/NameTable.js");
js_module_includer("dist/table/NameTable.js");

// js_includer("com/byteface/font/table/NameRecord.js");
js_module_includer("dist/table/NameRecord.js");

// js_includer("com/byteface/font/table/MaxpTable.js");
js_module_includer("dist/table/MaxpTable.js");

// js_includer("com/byteface/font/table/PostTable.js");
js_module_includer("dist/table/PostTable.js");

// js_includer("com/byteface/font/table/GsubTable.js");
js_module_includer("dist/table/GsubTable.js");

// js_includer("com/byteface/font/table/GlyfSimpleDescript.js");
js_module_includer("dist/table/GlyfSimpleDescript.js");

// js_includer("com/byteface/font/table/GlyfCompositeDescript.js");
js_module_includer("dist/table/GlyfCompositeDescript.js");

// js_includer("com/byteface/font/table/Script.js");
js_module_includer("dist/table/Script.js");

// js_includer("com/byteface/font/table/ScriptRecord.js");
js_module_includer("dist/table/ScriptRecord.js");

// js_includer("com/byteface/font/data/Point.js");
js_module_includer("dist/data/Point.js");

// js_includer("com/byteface/font/data/GlyphData.js");
js_module_includer("dist/data/GlyphData.js");

// js_includer("com/byteface/font/table/GlyfCompositeComp.js");
js_module_includer("dist/table/GlyfCompositeComp.js");
