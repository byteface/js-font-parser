var XMLConstants = /** @class */ (function () {
    function XMLConstants() {
    }
    // Namespace URIs
    XMLConstants.XML_NAMESPACE_URI = "http://www.w3.org/XML/1998/namespace";
    XMLConstants.XMLNS_NAMESPACE_URI = "http://www.w3.org/2000/xmlns/";
    XMLConstants.XLINK_NAMESPACE_URI = "http://www.w3.org/1999/xlink";
    XMLConstants.XML_EVENTS_NAMESPACE_URI = "http://www.w3.org/2001/xml-events";
    // Namespace prefixes
    XMLConstants.XML_PREFIX = "xml";
    XMLConstants.XMLNS_PREFIX = "xmlns";
    XMLConstants.XLINK_PREFIX = "xlink";
    // xml:{base,id,lang,space} and XML Events attributes
    XMLConstants.XML_BASE_ATTRIBUTE = "base";
    XMLConstants.XML_ID_ATTRIBUTE = "id";
    XMLConstants.XML_LANG_ATTRIBUTE = "lang";
    XMLConstants.XML_SPACE_ATTRIBUTE = "space";
    XMLConstants.XML_BASE_QNAME = "".concat(XMLConstants.XML_PREFIX, ":").concat(XMLConstants.XML_BASE_ATTRIBUTE);
    XMLConstants.XML_ID_QNAME = "".concat(XMLConstants.XML_PREFIX, ":").concat(XMLConstants.XML_ID_ATTRIBUTE);
    XMLConstants.XML_LANG_QNAME = "".concat(XMLConstants.XML_PREFIX, ":").concat(XMLConstants.XML_LANG_ATTRIBUTE);
    XMLConstants.XML_SPACE_QNAME = "".concat(XMLConstants.XML_PREFIX, ":").concat(XMLConstants.XML_SPACE_ATTRIBUTE);
    XMLConstants.XML_DEFAULT_VALUE = "default";
    XMLConstants.XML_PRESERVE_VALUE = "preserve";
    XMLConstants.XML_EVENTS_EVENT_ATTRIBUTE = "event";
    // XLink attributes
    XMLConstants.XLINK_HREF_ATTRIBUTE = "href";
    XMLConstants.XLINK_HREF_QNAME = "".concat(XMLConstants.XLINK_PREFIX, ":").concat(XMLConstants.XLINK_HREF_ATTRIBUTE);
    // Serialization constants
    XMLConstants.XML_TAB = "    ";
    XMLConstants.XML_OPEN_TAG_END_CHILDREN = " >";
    XMLConstants.XML_OPEN_TAG_END_NO_CHILDREN = " />";
    XMLConstants.XML_OPEN_TAG_START = "<";
    XMLConstants.XML_CLOSE_TAG_START = "</";
    XMLConstants.XML_CLOSE_TAG_END = ">";
    XMLConstants.XML_SPACE = " ";
    XMLConstants.XML_EQUAL_SIGN = "=";
    XMLConstants.XML_EQUAL_QUOT = "=\"";
    XMLConstants.XML_DOUBLE_QUOTE = "\"";
    XMLConstants.XML_CHAR_QUOT = '\"';
    XMLConstants.XML_CHAR_LT = '<';
    XMLConstants.XML_CHAR_GT = '>';
    XMLConstants.XML_CHAR_APOS = '\'';
    XMLConstants.XML_CHAR_AMP = '&';
    XMLConstants.XML_ENTITY_QUOT = "&quot;";
    XMLConstants.XML_ENTITY_LT = "&lt;";
    XMLConstants.XML_ENTITY_GT = "&gt;";
    XMLConstants.XML_ENTITY_APOS = "&apos;";
    XMLConstants.XML_ENTITY_AMP = "&amp;";
    XMLConstants.XML_CHAR_REF_PREFIX = "&#x";
    XMLConstants.XML_CHAR_REF_SUFFIX = ";";
    XMLConstants.XML_CDATA_END = "]]>";
    XMLConstants.XML_DOUBLE_DASH = "--";
    XMLConstants.XML_PROCESSING_INSTRUCTION_END = "?>";
    // XML versions
    XMLConstants.XML_VERSION_10 = "1.0";
    XMLConstants.XML_VERSION_11 = "1.1";
    return XMLConstants;
}());
export { XMLConstants };
