/*

Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements.  See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License.  You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Contains common XML constants.

@author <a href="mailto:vhardy@eng.sun.com">Vincent Hardy</a>
@version $Id: XMLConstants.java 475477 2006-11-15 22:44:28Z cam $

ported to as3 <a href="mailto:byteface@googlemail.com">Michael Lawrence</a>
ported to javascript <a href="mailto=byteface@googlemail.com">Michael Lawrence</a>

*/

function XMLConstants(){}

// Namespace URIs
XMLConstants.XML_NAMESPACE_URI ="http://www.w3.org/XML/1998/namespace";
XMLConstants.XMLNS_NAMESPACE_URI ="http://www.w3.org/2000/xmlns/";
XMLConstants.XLINK_NAMESPACE_URI ="http://www.w3.org/1999/xlink";
XMLConstants.XML_EVENTS_NAMESPACE_URI ="http://www.w3.org/2001/xml-events";

// Namespace prefixes
XMLConstants.XML_PREFIX ="xml";
XMLConstants.XMLNS_PREFIX ="xmlns";
XMLConstants.XLINK_PREFIX ="xlink";

// xml:{base,id,lang,space} and XML Events attributes
XMLConstants.XML_BASE_ATTRIBUTE ="base";
XMLConstants.XML_ID_ATTRIBUTE ="id";
XMLConstants.XML_LANG_ATTRIBUTE ="lang";
XMLConstants.XML_SPACE_ATTRIBUTE ="space";

XMLConstants.XML_BASE_QNAME = XMLConstants.XML_PREFIX + ':' + XMLConstants.XML_BASE_ATTRIBUTE;
XMLConstants.XML_ID_QNAME = XMLConstants.XML_PREFIX + ':' + XMLConstants.XML_ID_ATTRIBUTE;
XMLConstants.XML_LANG_QNAME = XMLConstants.XML_PREFIX + ':' + XMLConstants.XML_LANG_ATTRIBUTE;
XMLConstants.XML_SPACE_QNAME = XMLConstants.XML_PREFIX + ':' + XMLConstants.XML_SPACE_ATTRIBUTE;

XMLConstants.XML_DEFAULT_VALUE ="default";
XMLConstants.XML_PRESERVE_VALUE ="preserve";

XMLConstants.XML_EVENTS_EVENT_ATTRIBUTE ="event";

// XLink attributes
XMLConstants.XLINK_HREF_ATTRIBUTE ="href";
XMLConstants.XLINK_HREF_QNAME = XMLConstants.XLINK_PREFIX + ':' + XMLConstants.XLINK_HREF_ATTRIBUTE;

// Serialization constants
XMLConstants.XML_TAB ="    ";
XMLConstants.XML_OPEN_TAG_END_CHILDREN =" >";
XMLConstants.XML_OPEN_TAG_END_NO_CHILDREN =" />";
XMLConstants.XML_OPEN_TAG_START ="<";
XMLConstants.XML_CLOSE_TAG_START ="</";
XMLConstants.XML_CLOSE_TAG_END =">";
XMLConstants.XML_SPACE =" ";
XMLConstants.XML_EQUAL_SIGN ="=";
XMLConstants.XML_EQUAL_QUOT ="=\"";
XMLConstants.XML_DOUBLE_QUOTE ="\"";
XMLConstants.XML_CHAR_QUOT ='\"';
XMLConstants.XML_CHAR_LT ='<';
XMLConstants.XML_CHAR_GT ='>';
XMLConstants.XML_CHAR_APOS ='\'';
XMLConstants.XML_CHAR_AMP ='&';
XMLConstants.XML_ENTITY_QUOT ="&quot;";
XMLConstants.XML_ENTITY_LT ="&lt;";
XMLConstants.XML_ENTITY_GT ="&gt;";
XMLConstants.XML_ENTITY_APOS ="&apos;";
XMLConstants.XML_ENTITY_AMP ="&amp;";
XMLConstants.XML_CHAR_REF_PREFIX ="&#x";
XMLConstants.XML_CHAR_REF_SUFFIX =";";
XMLConstants.XML_CDATA_END ="]]>";
XMLConstants.XML_DOUBLE_DASH ="--";
XMLConstants.XML_PROCESSING_INSTRUCTION_END ="?>";

// XML versions
XMLConstants.XML_VERSION_10 ="1.0";
XMLConstants.XML_VERSION_11 ="1.1";
