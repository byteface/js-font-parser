export class XMLConstants {
    // Namespace URIs
    static readonly XML_NAMESPACE_URI: string = "http://www.w3.org/XML/1998/namespace";
    static readonly XMLNS_NAMESPACE_URI: string = "http://www.w3.org/2000/xmlns/";
    static readonly XLINK_NAMESPACE_URI: string = "http://www.w3.org/1999/xlink";
    static readonly XML_EVENTS_NAMESPACE_URI: string = "http://www.w3.org/2001/xml-events";

    // Namespace prefixes
    static readonly XML_PREFIX: string = "xml";
    static readonly XMLNS_PREFIX: string = "xmlns";
    static readonly XLINK_PREFIX: string = "xlink";

    // xml:{base,id,lang,space} and XML Events attributes
    static readonly XML_BASE_ATTRIBUTE: string = "base";
    static readonly XML_ID_ATTRIBUTE: string = "id";
    static readonly XML_LANG_ATTRIBUTE: string = "lang";
    static readonly XML_SPACE_ATTRIBUTE: string = "space";

    static readonly XML_BASE_QNAME: string = `${XMLConstants.XML_PREFIX}:${XMLConstants.XML_BASE_ATTRIBUTE}`;
    static readonly XML_ID_QNAME: string = `${XMLConstants.XML_PREFIX}:${XMLConstants.XML_ID_ATTRIBUTE}`;
    static readonly XML_LANG_QNAME: string = `${XMLConstants.XML_PREFIX}:${XMLConstants.XML_LANG_ATTRIBUTE}`;
    static readonly XML_SPACE_QNAME: string = `${XMLConstants.XML_PREFIX}:${XMLConstants.XML_SPACE_ATTRIBUTE}`;

    static readonly XML_DEFAULT_VALUE: string = "default";
    static readonly XML_PRESERVE_VALUE: string = "preserve";

    static readonly XML_EVENTS_EVENT_ATTRIBUTE: string = "event";

    // XLink attributes
    static readonly XLINK_HREF_ATTRIBUTE: string = "href";
    static readonly XLINK_HREF_QNAME: string = `${XMLConstants.XLINK_PREFIX}:${XMLConstants.XLINK_HREF_ATTRIBUTE}`;

    // Serialization constants
    static readonly XML_TAB: string = "    ";
    static readonly XML_OPEN_TAG_END_CHILDREN: string = " >";
    static readonly XML_OPEN_TAG_END_NO_CHILDREN: string = " />";
    static readonly XML_OPEN_TAG_START: string = "<";
    static readonly XML_CLOSE_TAG_START: string = "</";
    static readonly XML_CLOSE_TAG_END: string = ">";
    static readonly XML_SPACE: string = " ";
    static readonly XML_EQUAL_SIGN: string = "=";
    static readonly XML_EQUAL_QUOT: string = "=\"";
    static readonly XML_DOUBLE_QUOTE: string = "\"";
    static readonly XML_CHAR_QUOT: string = '\"';
    static readonly XML_CHAR_LT: string = '<';
    static readonly XML_CHAR_GT: string = '>';
    static readonly XML_CHAR_APOS: string = '\'';
    static readonly XML_CHAR_AMP: string = '&';
    static readonly XML_ENTITY_QUOT: string = "&quot;";
    static readonly XML_ENTITY_LT: string = "&lt;";
    static readonly XML_ENTITY_GT: string = "&gt;";
    static readonly XML_ENTITY_APOS: string = "&apos;";
    static readonly XML_ENTITY_AMP: string = "&amp;";
    static readonly XML_CHAR_REF_PREFIX: string = "&#x";
    static readonly XML_CHAR_REF_SUFFIX: string = ";";
    static readonly XML_CDATA_END: string = "]]>";
    static readonly XML_DOUBLE_DASH: string = "--";
    static readonly XML_PROCESSING_INSTRUCTION_END: string = "?>";

    // XML versions
    static readonly XML_VERSION_10: string = "1.0";
    static readonly XML_VERSION_11: string = "1.1";
}
