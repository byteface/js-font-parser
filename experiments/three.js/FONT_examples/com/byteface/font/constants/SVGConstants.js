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

Define SVG constants, such as tag names, attribute names and URI

@author <a href="mailto:tkormann@apache.org">Thierry Kormann</a>
@author <a href="mailto:vincent.hardy@eng.sun.com">Vincent Hardy</a>
@author <a href="mailto:stephane@hillion.org">Stephane Hillion</a>
@version $Id: SVGConstants.java 598513 2007-11-27 04:21:10Z cam $
 
ported to as3 <a href="mailto:byteface@googlemail.com">Michael Lawrence</a>
ported to javascript <a href="mailto=byteface@googlemail.com">Michael Lawrence</a>

*/

// TODO - create a class for global functions like this one/* jsHandler.js */
function inc(filename)
{
    var body = document.getElementsByTagName('body').item(0);
    script = document.createElement('script');
    script.src = filename;
    script.type = 'text/javascript';
    body.appendChild(script);
}


function SVGConstants(){}

/////////////////////////////////////////////////////////////////////////
// SVG general
/////////////////////////////////////////////////////////////////////////

SVGConstants.SVG_PUBLIC_ID = "-//W3C//DTD SVG 1.0//EN";
SVGConstants.SVG_SYSTEM_ID = "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd";
SVGConstants.SVG_NAMESPACE_URI = "http://www.w3.org/2000/svg";
SVGConstants.SVG_VERSION = "1.0";

//////////////////////////////////////////////////////////////////////////
// Events type and attributes
//////////////////////////////////////////////////////////////////////////

/**
 * The event type for MouseEvent.
 */
SVGConstants.SVG_MOUSEEVENTS_EVENT_TYPE = "MouseEvents";

/**
 * The event type for UIEvent.
 */
SVGConstants.SVG_UIEVENTS_EVENT_TYPE = "UIEvents";

/**
 * The event type for SVGEvent.
 */
SVGConstants.SVG_SVGEVENTS_EVENT_TYPE = "SVGEvents";

/**
 * The event type for KeyEvent.
 */
SVGConstants.SVG_KEYEVENTS_EVENT_TYPE = "KeyEvents";

// ---------------------------------------------------------------------

/**
 * The event type for 'keydown' KeyEvent.
 */
SVGConstants.SVG_KEYDOWN_EVENT_TYPE = "keydown";

/**
 * The event type for 'keypress' KeyEvent.
 */
SVGConstants.SVG_KEYPRESS_EVENT_TYPE = "keypress";

/**
 * The event type for 'keyup' KeyEvent.
 */
SVGConstants.SVG_KEYUP_EVENT_TYPE = "keyup";

/**
 * The event type for 'click' MouseEvent.
 */
SVGConstants.SVG_CLICK_EVENT_TYPE = "click";

/**
 * The event type for 'mouseup' MouseEvent.
 */
SVGConstants.SVG_MOUSEUP_EVENT_TYPE = "mouseup";

/**
 * The event type for 'mousedown' MouseEvent.
 */
SVGConstants.SVG_MOUSEDOWN_EVENT_TYPE = "mousedown";

/**
 * The event type for 'mousemove' MouseEvent.
 */
SVGConstants.SVG_MOUSEMOVE_EVENT_TYPE = "mousemove";

/**
 * The event type for 'mouseout' MouseEvent.
 */
SVGConstants.SVG_MOUSEOUT_EVENT_TYPE = "mouseout";

/**
 * The event type for 'mouseover' MouseEvent.
 */
SVGConstants.SVG_MOUSEOVER_EVENT_TYPE = "mouseover";

/**
 * The event type for 'DOMFocusIn' UIEvent.
 */
SVGConstants.SVG_DOMFOCUSIN_EVENT_TYPE = "DOMFocusIn";

/**
 * The event type for 'DOMFocusOut' UIEvent.
 */
SVGConstants.SVG_DOMFOCUSOUT_EVENT_TYPE = "DOMFocusOut";

/**
 * The event type for 'DOMActivate' UIEvent.
 */
SVGConstants.SVG_DOMACTIVATE_EVENT_TYPE = "DOMActivate";

/**
 * The event type for 'SVGLoad' SVGEvent.
 */
SVGConstants.SVG_SVGLOAD_EVENT_TYPE = "SVGLoad";

/**
 * The event type for 'SVGUnload' SVGEvent.
 */
SVGConstants.SVG_SVGUNLOAD_EVENT_TYPE = "SVGUnload";

/**
 * The event type for 'SVGAbort' SVGEvent.
 */
SVGConstants.SVG_SVGABORT_EVENT_TYPE = "SVGAbort";

/**
 * The event type for 'SVGError' SVGEvent.
 */
SVGConstants.SVG_SVGERROR_EVENT_TYPE = "SVGError";

/**
 * The event type for 'SVGResize' SVGEvent.
 */
SVGConstants.SVG_SVGRESIZE_EVENT_TYPE = "SVGResize";

/**
 * The event type for 'SVGScroll' SVGEvent.
 */
SVGConstants.SVG_SVGSCROLL_EVENT_TYPE = "SVGScroll";

/**
 * The event type for 'SVGZoom' SVGEvent.
 */
SVGConstants.SVG_SVGZOOM_EVENT_TYPE = "SVGZoom";

// ---------------------------------------------------------------------

/**
 * The 'onkeyup' attribute name of type KeyEvents.
 */
SVGConstants.SVG_ONKEYUP_ATTRIBUTE = "onkeyup";

/**
 * The 'onkeydown' attribute name of type KeyEvents.
 */
SVGConstants.SVG_ONKEYDOWN_ATTRIBUTE = "onkeydown";

/**
 * The 'onkeypress' attribute name of type KeyEvents.
 */
SVGConstants.SVG_ONKEYPRESS_ATTRIBUTE = "onkeypress";

/**
 * The 'onabort' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONABORT_ATTRIBUTE = "onabort";

/**
 * The 'onabort' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONACTIVATE_ATTRIBUTE = "onactivate";

/**
 * The 'onbegin' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONBEGIN_ATTRIBUTE = "onbegin";

/**
 * The 'onclick' attribute name of type MouseEvents.
 */
SVGConstants.SVG_ONCLICK_ATTRIBUTE = "onclick";

/**
 * The 'onend' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONEND_ATTRIBUTE = "onend";

/**
 * The 'onerror' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONERROR_ATTRIBUTE = "onerror";

/**
 * The 'onfocusin' attribute name of type UIEvents.
 */
SVGConstants.SVG_ONFOCUSIN_ATTRIBUTE = "onfocusin";

/**
 * The 'onfocusout' attribute name of type UIEvents.
 */
SVGConstants.SVG_ONFOCUSOUT_ATTRIBUTE = "onfocusout";

/**
 * The 'onload' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONLOAD_ATTRIBUTE = "onload";

/**
 * The 'onmousedown' attribute name of type MouseEvents.
 */
SVGConstants.SVG_ONMOUSEDOWN_ATTRIBUTE = "onmousedown";

/**
 * The 'onmousemove' attribute name of type MouseEvents.
 */
SVGConstants.SVG_ONMOUSEMOVE_ATTRIBUTE = "onmousemove";

/**
 * The 'onmouseout' attribute name of type MouseEvents.
 */
SVGConstants.SVG_ONMOUSEOUT_ATTRIBUTE = "onmouseout";

/**
 * The 'onmouseover' attribute name of type MouseEvents.
 */
SVGConstants.SVG_ONMOUSEOVER_ATTRIBUTE = "onmouseover";

/**
 * The 'onmouseup' attribute name of type MouseEvents.
 */
SVGConstants.SVG_ONMOUSEUP_ATTRIBUTE = "onmouseup";

/**
 * The 'onrepeat' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONREPEAT_ATTRIBUTE = "onrepeat";

/**
 * The 'onresize' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONRESIZE_ATTRIBUTE = "onresize";

/**
 * The 'onscroll' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONSCROLL_ATTRIBUTE = "onscroll";

/**
 * The 'onunload' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONUNLOAD_ATTRIBUTE = "onunload";

/**
 * The 'onzoom' attribute name of type SVGEvents.
 */
SVGConstants.SVG_ONZOOM_ATTRIBUTE = "onzoom";

/////////////////////////////////////////////////////////////////////////
// SVG features
/////////////////////////////////////////////////////////////////////////

// SVG 1.0 feature public static consts
SVGConstants.SVG_ORG_W3C_SVG_FEATURE = "org.w3c.svg";
SVGConstants.SVG_ORG_W3C_SVG_STATIC_FEATURE = "org.w3c.svg.static";
SVGConstants.SVG_ORG_W3C_SVG_ANIMATION_FEATURE = "org.w3c.svg.animation";
SVGConstants.SVG_ORG_W3C_SVG_DYNAMIC_FEATURE = "org.w3c.svg.dynamic";
SVGConstants.SVG_ORG_W3C_SVG_ALL_FEATURE = "org.w3c.svg.all";
SVGConstants.SVG_ORG_W3C_DOM_SVG_FEATURE = "org.w3c.dom.svg";
SVGConstants.SVG_ORG_W3C_DOM_SVG_STATIC_FEATURE = "org.w3c.dom.svg.static";
SVGConstants.SVG_ORG_W3C_DOM_SVG_ANIMATION_FEATURE = "org.w3c.dom.svg.animation";
SVGConstants.SVG_ORG_W3C_DOM_SVG_DYNAMIC_FEATURE = "org.w3c.dom.svg.dynamic";
SVGConstants.SVG_ORG_W3C_DOM_SVG_ALL_FEATURE = "org.w3c.dom.svg.all";

// SVG 1.1 feature public static consts
SVGConstants.SVG_SVG11_SVG_FEATURE = "http://www.w3.org/TR/SVG11/feature#SVG";
SVGConstants.SVG_SVG11_SVG_DOM_FEATURE = "http://www.w3.org/TR/SVG11/feature#SVGDOM";
SVGConstants.SVG_SVG11_SVG_STATIC_FEATURE = "http://www.w3.org/TR/SVG11/feature#SVG-static";
SVGConstants.SVG_SVG11_SVG_DOM_STATIC_FEATURE = "http://www.w3.org/TR/SVG11/feature#SVGDOM-static";
SVGConstants.SVG_SVG11_SVG_ANIMATION_FEATURE = "http://www.w3.org/TR/SVG11/feature#SVG-animation";
SVGConstants.SVG_SVG11_SVG_DOM_ANIMATION_FEATURE = "http://www.w3.org/TR/SVG11/feature#SVGDOM-animation";
SVGConstants.SVG_SVG11_SVG_DYNAMIC_FEATURE = "http://www.w3.org/TR/SVG11/feature#SVG-dynamic";
SVGConstants.SVG_SVG11_SVG_DOM_DYNAMIC_FEATURE = "http://www.w3.org/TR/SVG11/feature#SVGDOM-dynamic";
SVGConstants.SVG_SVG11_CORE_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#CoreAttribute";
SVGConstants.SVG_SVG11_STRUCTURE_FEATURE = "http://www.w3.org/TR/SVG11/feature#Structure";
SVGConstants.SVG_SVG11_BASIC_STRUCTURE_FEATURE = "http://www.w3.org/TR/SVG11/feature#BasicStructure";
SVGConstants.SVG_SVG11_CONTAINER_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#ContainerAttribute";
SVGConstants.SVG_SVG11_CONDITIONAL_PROCESSING_FEATURE = "http://www.w3.org/TR/SVG11/feature#ConditionalProcessing";
SVGConstants.SVG_SVG11_IMAGE_FEATURE = "http://www.w3.org/TR/SVG11/feature#Image";
SVGConstants.SVG_SVG11_STYLE_FEATURE = "http://www.w3.org/TR/SVG11/feature#Style";
SVGConstants.SVG_SVG11_VIEWPORT_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#ViewportAttribute";
SVGConstants.SVG_SVG11_SHAPE_FEATURE = "http://www.w3.org/TR/SVG11/feature#Shape";
SVGConstants.SVG_SVG11_TEXT_FEATURE = "http://www.w3.org/TR/SVG11/feature#Text";
SVGConstants.SVG_SVG11_BASIC_TEXT_FEATURE = "http://www.w3.org/TR/SVG11/feature#BasicText";
SVGConstants.SVG_SVG11_PAINT_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#PaintAttribute";
SVGConstants.SVG_SVG11_BASIC_PAINT_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#BasicPaintAttribute";
SVGConstants.SVG_SVG11_OPACITY_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#OpacityAttribute";
SVGConstants.SVG_SVG11_GRAPHICS_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#GraphicsAttribute";
SVGConstants.SVG_SVG11_BASIC_GRAPHICS_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#BasicGraphicsAttribute";
SVGConstants.SVG_SVG11_MARKER_FEATURE = "http://www.w3.org/TR/SVG11/feature#Marker";
SVGConstants.SVG_SVG11_COLOR_PROFILE_FEATURE = "http://www.w3.org/TR/SVG11/feature#ColorProfile";
SVGConstants.SVG_SVG11_GRADIENT_FEATURE = "http://www.w3.org/TR/SVG11/feature#Gradient";
SVGConstants.SVG_SVG11_PATTERN_FEATURE = "http://www.w3.org/TR/SVG11/feature#Pattern";
SVGConstants.SVG_SVG11_CLIP_FEATURE = "http://www.w3.org/TR/SVG11/feature#Clip";
SVGConstants.SVG_SVG11_BASIC_CLIP_FEATURE = "http://www.w3.org/TR/SVG11/feature#BasicClip";
SVGConstants.SVG_SVG11_MASK_FEATURE = "http://www.w3.org/TR/SVG11/feature#Mask";
SVGConstants.SVG_SVG11_FILTER_FEATURE = "http://www.w3.org/TR/SVG11/feature#Filter";
SVGConstants.SVG_SVG11_BASIC_FILTER_FEATURE = "http://www.w3.org/TR/SVG11/feature#BasicFilter";
SVGConstants.SVG_SVG11_DOCUMENT_EVENTS_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#DocumentEventsAttribute";
SVGConstants.SVG_SVG11_GRAPHICAL_EVENTS_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#GraphicalEventsAttribute";
SVGConstants.SVG_SVG11_ANIMATION_EVENTS_ATTRIBUTE_FEATURE = "http://www.w3.org/TR/SVG11/feature#AnimationEventsAttribute";
SVGConstants.SVG_SVG11_CURSOR_FEATURE = "http://www.w3.org/TR/SVG11/feature#Cursor";
SVGConstants.SVG_SVG11_HYPERLINKING_FEATURE = "http://www.w3.org/TR/SVG11/feature#Hyperlinking";
SVGConstants.SVG_SVG11_XLINK_FEATURE = "http://www.w3.org/TR/SVG11/feature#Xlink";
SVGConstants.SVG_SVG11_EXTERNAL_RESOURCES_REQUIRED_FEATURE = "http://www.w3.org/TR/SVG11/feature#ExternalResourcesRequired";
SVGConstants.SVG_SVG11_VIEW_FEATURE = "http://www.w3.org/TR/SVG11/feature#View";
SVGConstants.SVG_SVG11_SCRIPT_FEATURE = "http://www.w3.org/TR/SVG11/feature#Script";
SVGConstants.SVG_SVG11_ANIMATION_FEATURE = "http://www.w3.org/TR/SVG11/feature#Animation";
SVGConstants.SVG_SVG11_FONT_FEATURE = "http://www.w3.org/TR/SVG11/feature#Font";
SVGConstants.SVG_SVG11_BASIC_FONT_FEATURE = "http://www.w3.org/TR/SVG11/feature#BasicFont";
SVGConstants.SVG_SVG11_EXTENSIBILITY_FEATURE = "http://www.w3.org/TR/SVG11/feature#Extensibility";

// TODO SVG 1.2 feature public static consts

/////////////////////////////////////////////////////////////////////////
// SVG tags
/////////////////////////////////////////////////////////////////////////

SVGConstants.SVG_A_TAG = "a";
SVGConstants.SVG_ALT_GLYPH_TAG = "altGlyph";
SVGConstants.SVG_ALT_GLYPH_DEF_TAG = "altGlyphDef";
SVGConstants.SVG_ALT_GLYPH_ITEM_TAG = "altGlyphItem";
SVGConstants.SVG_ANIMATE_TAG = "animate";
SVGConstants.SVG_ANIMATE_COLOR_TAG = "animateColor";
SVGConstants.SVG_ANIMATE_MOTION_TAG = "animateMotion";
SVGConstants.SVG_ANIMATE_TRANSFORM_TAG = "animateTransform";
SVGConstants.SVG_CIRCLE_TAG = "circle";
SVGConstants.SVG_CLIP_PATH_TAG = "clipPath";
SVGConstants.SVG_COLOR_PROFILE_TAG = "color-profile";
SVGConstants.SVG_CURSOR_TAG = "cursor";
SVGConstants.SVG_DEFINITION_SRC_TAG = "definition-src";
SVGConstants.SVG_DEFS_TAG = "defs";
SVGConstants.SVG_DESC_TAG = "desc";
SVGConstants.SVG_ELLIPSE_TAG = "ellipse";
SVGConstants.SVG_FE_BLEND_TAG = "feBlend";
SVGConstants.SVG_FE_COLOR_MATRIX_TAG = "feColorMatrix";
SVGConstants.SVG_FE_COMPONENT_TRANSFER_TAG = "feComponentTransfer";
SVGConstants.SVG_FE_COMPOSITE_TAG = "feComposite";
SVGConstants.SVG_FE_CONVOLVE_MATRIX_TAG = "feConvolveMatrix";
SVGConstants.SVG_FE_DIFFUSE_LIGHTING_TAG = "feDiffuseLighting";
SVGConstants.SVG_FE_DISPLACEMENT_MAP_TAG = "feDisplacementMap";
SVGConstants.SVG_FE_DISTANT_LIGHT_TAG = "feDistantLight";
SVGConstants.SVG_FE_FLOOD_TAG = "feFlood";
SVGConstants.SVG_FE_FUNC_A_TAG = "feFuncA";
SVGConstants.SVG_FE_FUNC_B_TAG = "feFuncB";
SVGConstants.SVG_FE_FUNC_G_TAG = "feFuncG";
SVGConstants.SVG_FE_FUNC_R_TAG = "feFuncR";
SVGConstants.SVG_FE_GAUSSIAN_BLUR_TAG = "feGaussianBlur";
SVGConstants.SVG_FE_IMAGE_TAG = "feImage";
SVGConstants.SVG_FE_MERGE_NODE_TAG = "feMergeNode";
SVGConstants.SVG_FE_MERGE_TAG = "feMerge";
SVGConstants.SVG_FE_MORPHOLOGY_TAG = "feMorphology";
SVGConstants.SVG_FE_OFFSET_TAG = "feOffset";
SVGConstants.SVG_FE_POINT_LIGHT_TAG = "fePointLight";
SVGConstants.SVG_FE_SPECULAR_LIGHTING_TAG = "feSpecularLighting";
SVGConstants.SVG_FE_SPOT_LIGHT_TAG = "feSpotLight";
SVGConstants.SVG_FE_TILE_TAG = "feTile";
SVGConstants.SVG_FE_TURBULENCE_TAG = "feTurbulence";
SVGConstants.SVG_FILTER_TAG = "filter";
SVGConstants.SVG_FONT_TAG = "font";
SVGConstants.SVG_FONT_FACE_TAG = "font-face";
SVGConstants.SVG_FONT_FACE_FORMAT_TAG = "font-face-format";
SVGConstants.SVG_FONT_FACE_NAME_TAG = "font-face-name";
SVGConstants.SVG_FONT_FACE_SRC_TAG = "font-face-src";
SVGConstants.SVG_FONT_FACE_URI_TAG = "font-face-uri";
SVGConstants.SVG_FOREIGN_OBJECT_TAG = "foreignObject";
SVGConstants.SVG_G_TAG = "g";
SVGConstants.SVG_GLYPH_TAG = "glyph";
SVGConstants.SVG_GLYPH_REF_TAG = "glyphRef";
SVGConstants.SVG_HKERN_TAG = "hkern";
SVGConstants.SVG_IMAGE_TAG = "image";
SVGConstants.SVG_LINE_TAG = "line";
SVGConstants.SVG_LINEAR_GRADIENT_TAG = "linearGradient";
SVGConstants.SVG_MARKER_TAG = "marker";
SVGConstants.SVG_MASK_TAG = "mask";
SVGConstants.SVG_METADATA_TAG = "metadata";
SVGConstants.SVG_MISSING_GLYPH_TAG = "missing-glyph";
SVGConstants.SVG_MPATH_TAG = "mpath";
SVGConstants.SVG_PATH_TAG = "path";
SVGConstants.SVG_PATTERN_TAG = "pattern";
SVGConstants.SVG_POLYGON_TAG = "polygon";
SVGConstants.SVG_POLYLINE_TAG = "polyline";
SVGConstants.SVG_RADIAL_GRADIENT_TAG = "radialGradient";
SVGConstants.SVG_RECT_TAG = "rect";
SVGConstants.SVG_SET_TAG = "set";
SVGConstants.SVG_SCRIPT_TAG = "script";
SVGConstants.SVG_STOP_TAG = "stop";
SVGConstants.SVG_STYLE_TAG = "style";
SVGConstants.SVG_SVG_TAG = "svg";
SVGConstants.SVG_SWITCH_TAG = "switch";
SVGConstants.SVG_SYMBOL_TAG = "symbol";
SVGConstants.SVG_TEXT_PATH_TAG = "textPath";
SVGConstants.SVG_TEXT_TAG = "text";
SVGConstants.SVG_TITLE_TAG = "title";
SVGConstants.SVG_TREF_TAG = "tref";
SVGConstants.SVG_TSPAN_TAG = "tspan";
SVGConstants.SVG_USE_TAG = "use";
SVGConstants.SVG_VIEW_TAG = "view";
SVGConstants.SVG_VKERN_TAG = "vkern";

/////////////////////////////////////////////////////////////////////////
// SVG attributes
/////////////////////////////////////////////////////////////////////////

SVGConstants.SVG_ACCENT_HEIGHT_ATTRIBUTE = "accent-height";
SVGConstants.SVG_ACCUMULATE_ATTRIBUTE = "accumulate";
SVGConstants.SVG_ADDITIVE_ATTRIBUTE = "additive";
SVGConstants.SVG_AMPLITUDE_ATTRIBUTE = "amplitude";
SVGConstants.SVG_ARABIC_FORM_ATTRIBUTE = "arabic-form";
SVGConstants.SVG_ASCENT_ATTRIBUTE = "ascent";
SVGConstants.SVG_AZIMUTH_ATTRIBUTE = "azimuth";
SVGConstants.SVG_ALPHABETIC_ATTRIBUTE = "alphabetic";
SVGConstants.SVG_ATTRIBUTE_NAME_ATTRIBUTE = "attributeName";
SVGConstants.SVG_ATTRIBUTE_TYPE_ATTRIBUTE = "attributeType";
SVGConstants.SVG_BASE_FREQUENCY_ATTRIBUTE = "baseFrequency";
SVGConstants.SVG_BASE_PROFILE_ATTRIBUTE = "baseProfile";
SVGConstants.SVG_BEGIN_ATTRIBUTE = "begin";
SVGConstants.SVG_BBOX_ATTRIBUTE = "bbox";
SVGConstants.SVG_BIAS_ATTRIBUTE = "bias";
SVGConstants.SVG_BY_ATTRIBUTE = "by";
SVGConstants.SVG_CALC_MODE_ATTRIBUTE = "calcMode";
SVGConstants.SVG_CAP_HEIGHT_ATTRIBUTE = "cap-height";
SVGConstants.SVG_CLASS_ATTRIBUTE = "class";
SVGConstants.SVG_CLIP_PATH_ATTRIBUTE = CSSConstants.CSS_CLIP_PATH_PROPERTY;
SVGConstants.SVG_CLIP_PATH_UNITS_ATTRIBUTE = "clipPathUnits";
SVGConstants.SVG_COLOR_INTERPOLATION_ATTRIBUTE = CSSConstants.CSS_COLOR_INTERPOLATION_PROPERTY;
SVGConstants.SVG_COLOR_RENDERING_ATTRIBUTE = CSSConstants.CSS_COLOR_RENDERING_PROPERTY;
SVGConstants.SVG_CONTENT_SCRIPT_TYPE_ATTRIBUTE = "contentScriptType";
SVGConstants.SVG_CONTENT_STYLE_TYPE_ATTRIBUTE = "contentStyleType";
SVGConstants.SVG_CX_ATTRIBUTE = "cx";
SVGConstants.SVG_CY_ATTRIBUTE = "cy";
SVGConstants.SVG_DESCENT_ATTRIBUTE = "descent";
SVGConstants.SVG_DIFFUSE_CONSTANT_ATTRIBUTE = "diffuseConstant";
SVGConstants.SVG_DIVISOR_ATTRIBUTE = "divisor";
SVGConstants.SVG_DUR_ATTRIBUTE = "dur";
SVGConstants.SVG_DX_ATTRIBUTE = "dx";
SVGConstants.SVG_DY_ATTRIBUTE = "dy";
SVGConstants.SVG_D_ATTRIBUTE = "d";
SVGConstants.SVG_EDGE_MODE_ATTRIBUTE = "edgeMode";
SVGConstants.SVG_ELEVATION_ATTRIBUTE = "elevation";
SVGConstants.SVG_ENABLE_BACKGROUND_ATTRIBUTE = CSSConstants.CSS_ENABLE_BACKGROUND_PROPERTY;
SVGConstants.SVG_END_ATTRIBUTE = "end";
SVGConstants.SVG_EXPONENT_ATTRIBUTE = "exponent";
SVGConstants.SVG_EXTERNAL_RESOURCES_REQUIRED_ATTRIBUTE = "externalResourcesRequired";
SVGConstants.SVG_FILL_ATTRIBUTE = CSSConstants.CSS_FILL_PROPERTY;
SVGConstants.SVG_FILL_OPACITY_ATTRIBUTE = CSSConstants.CSS_FILL_OPACITY_PROPERTY;
SVGConstants.SVG_FILL_RULE_ATTRIBUTE = CSSConstants.CSS_FILL_RULE_PROPERTY;
SVGConstants.SVG_FILTER_ATTRIBUTE = CSSConstants.CSS_FILTER_PROPERTY;
SVGConstants.SVG_FILTER_RES_ATTRIBUTE = "filterRes";
SVGConstants.SVG_FILTER_UNITS_ATTRIBUTE = "filterUnits";
SVGConstants.SVG_FLOOD_COLOR_ATTRIBUTE = CSSConstants.CSS_FLOOD_COLOR_PROPERTY;
SVGConstants.SVG_FLOOD_OPACITY_ATTRIBUTE = CSSConstants.CSS_FLOOD_OPACITY_PROPERTY;
SVGConstants.SVG_FORMAT_ATTRIBUTE = "format";
SVGConstants.SVG_FONT_FAMILY_ATTRIBUTE = CSSConstants.CSS_FONT_FAMILY_PROPERTY;
SVGConstants.SVG_FONT_SIZE_ATTRIBUTE = CSSConstants.CSS_FONT_SIZE_PROPERTY;
SVGConstants.SVG_FONT_STRETCH_ATTRIBUTE = CSSConstants.CSS_FONT_STRETCH_PROPERTY;
SVGConstants.SVG_FONT_STYLE_ATTRIBUTE = CSSConstants.CSS_FONT_STYLE_PROPERTY;
SVGConstants.SVG_FONT_VARIANT_ATTRIBUTE = CSSConstants.CSS_FONT_VARIANT_PROPERTY;
SVGConstants.SVG_FONT_WEIGHT_ATTRIBUTE = CSSConstants.CSS_FONT_WEIGHT_PROPERTY;
SVGConstants.SVG_FROM_ATTRIBUTE = "from";
SVGConstants.SVG_FX_ATTRIBUTE = "fx";
SVGConstants.SVG_FY_ATTRIBUTE = "fy";
SVGConstants.SVG_G1_ATTRIBUTE = "g1";
SVGConstants.SVG_G2_ATTRIBUTE = "g2";
SVGConstants.SVG_GLYPH_NAME_ATTRIBUTE = "glyph-name";
SVGConstants.SVG_GLYPH_REF_ATTRIBUTE = "glyphRef";
SVGConstants.SVG_GRADIENT_TRANSFORM_ATTRIBUTE = "gradientTransform";
SVGConstants.SVG_GRADIENT_UNITS_ATTRIBUTE = "gradientUnits";
SVGConstants.SVG_HANGING_ATTRIBUTE = "hanging";
SVGConstants.SVG_HEIGHT_ATTRIBUTE = "height";
SVGConstants.SVG_HORIZ_ADV_X_ATTRIBUTE = "horiz-adv-x";
SVGConstants.SVG_HORIZ_ORIGIN_X_ATTRIBUTE = "horiz-origin-x";
SVGConstants.SVG_HORIZ_ORIGIN_Y_ATTRIBUTE = "horiz-origin-y";
SVGConstants.SVG_ID_ATTRIBUTE = XMLConstants.XML_ID_ATTRIBUTE;
SVGConstants.SVG_IDEOGRAPHIC_ATTRIBUTE = "ideographic";
SVGConstants.SVG_IMAGE_RENDERING_ATTRIBUTE = CSSConstants.CSS_IMAGE_RENDERING_PROPERTY;
SVGConstants.SVG_IN2_ATTRIBUTE = "in2";
SVGConstants.SVG_INTERCEPT_ATTRIBUTE = "intercept";
SVGConstants.SVG_IN_ATTRIBUTE = "in";
SVGConstants.SVG_K_ATTRIBUTE = "k";
SVGConstants.SVG_K1_ATTRIBUTE = "k1";
SVGConstants.SVG_K2_ATTRIBUTE = "k2";
SVGConstants.SVG_K3_ATTRIBUTE = "k3";
SVGConstants.SVG_K4_ATTRIBUTE = "k4";
SVGConstants.SVG_KERNEL_MATRIX_ATTRIBUTE = "kernelMatrix";
SVGConstants.SVG_KERNEL_UNIT_LENGTH_ATTRIBUTE = "kernelUnitLength";
SVGConstants.SVG_KERNING_ATTRIBUTE = CSSConstants.CSS_KERNING_PROPERTY;
SVGConstants.SVG_KEY_POINTS_ATTRIBUTE = "keyPoints";
SVGConstants.SVG_KEY_SPLINES_ATTRIBUTE = "keySplines";
SVGConstants.SVG_KEY_TIMES_ATTRIBUTE = "keyTimes";
SVGConstants.SVG_LANG_ATTRIBUTE = "lang";
SVGConstants.SVG_LENGTH_ADJUST_ATTRIBUTE = "lengthAdjust";
SVGConstants.SVG_LIGHT_COLOR_ATTRIBUTE = "lightColor";
SVGConstants.SVG_LIGHTING_COLOR_ATTRIBUTE = "lighting-color";
SVGConstants.SVG_LIMITING_CONE_ANGLE_ATTRIBUTE = "limitingConeAngle";
SVGConstants.SVG_LOCAL_ATTRIBUTE = "local";
SVGConstants.SVG_MARKER_HEIGHT_ATTRIBUTE = "markerHeight";
SVGConstants.SVG_MARKER_UNITS_ATTRIBUTE = "markerUnits";
SVGConstants.SVG_MARKER_WIDTH_ATTRIBUTE = "markerWidth";
SVGConstants.SVG_MASK_ATTRIBUTE = CSSConstants.CSS_MASK_PROPERTY;
SVGConstants.SVG_MASK_CONTENT_UNITS_ATTRIBUTE = "maskContentUnits";
SVGConstants.SVG_MASK_UNITS_ATTRIBUTE = "maskUnits";
SVGConstants.SVG_MATHEMATICAL_ATTRIBUTE = "mathematical";
SVGConstants.SVG_MAX_ATTRIBUTE = "max";
SVGConstants.SVG_MEDIA_ATTRIBUTE = "media";
SVGConstants.SVG_METHOD_ATTRIBUTE = "method";
SVGConstants.SVG_MIN_ATTRIBUTE = "min";
SVGConstants.SVG_MODE_ATTRIBUTE = "mode";
SVGConstants.SVG_NAME_ATTRIBUTE = "name";
SVGConstants.SVG_NUM_OCTAVES_ATTRIBUTE = "numOctaves";
SVGConstants.SVG_OFFSET_ATTRIBUTE = "offset";
SVGConstants.SVG_OPACITY_ATTRIBUTE = CSSConstants.CSS_OPACITY_PROPERTY;
SVGConstants.SVG_OPERATOR_ATTRIBUTE = "operator";
SVGConstants.SVG_ORDER_ATTRIBUTE = "order";
SVGConstants.SVG_ORDER_X_ATTRIBUTE = "orderX";
SVGConstants.SVG_ORDER_Y_ATTRIBUTE = "orderY";
SVGConstants.SVG_ORIENT_ATTRIBUTE = "orient";
SVGConstants.SVG_ORIENTATION_ATTRIBUTE = "orientation";
SVGConstants.SVG_ORIGIN_ATTRIBUTE = "origin";
SVGConstants.SVG_OVERLINE_POSITION_ATTRIBUTE = "overline-position";
SVGConstants.SVG_OVERLINE_THICKNESS_ATTRIBUTE = "overline-thickness";
SVGConstants.SVG_PANOSE_1_ATTRIBUTE = "panose-1";
SVGConstants.SVG_PATH_ATTRIBUTE = "path";
SVGConstants.SVG_PATH_LENGTH_ATTRIBUTE = "pathLength";
SVGConstants.SVG_PATTERN_CONTENT_UNITS_ATTRIBUTE = "patternContentUnits";
SVGConstants.SVG_PATTERN_TRANSFORM_ATTRIBUTE = "patternTransform";
SVGConstants.SVG_PATTERN_UNITS_ATTRIBUTE = "patternUnits";
SVGConstants.SVG_POINTS_ATTRIBUTE = "points";
SVGConstants.SVG_POINTS_AT_X_ATTRIBUTE = "pointsAtX";
SVGConstants.SVG_POINTS_AT_Y_ATTRIBUTE = "pointsAtY";
SVGConstants.SVG_POINTS_AT_Z_ATTRIBUTE = "pointsAtZ";
SVGConstants.SVG_PRESERVE_ALPHA_ATTRIBUTE = "preserveAlpha";
SVGConstants.SVG_PRESERVE_ASPECT_RATIO_ATTRIBUTE = "preserveAspectRatio";
SVGConstants.SVG_PRIMITIVE_UNITS_ATTRIBUTE = "primitiveUnits";
SVGConstants.SVG_RADIUS_ATTRIBUTE = "radius";
SVGConstants.SVG_REF_X_ATTRIBUTE = "refX";
SVGConstants.SVG_REF_Y_ATTRIBUTE = "refY";
SVGConstants.SVG_RENDERING_INTENT_ATTRIBUTE = "rendering-intent";
SVGConstants.SVG_REPEAT_COUNT_ATTRIBUTE = "repeatCount";
SVGConstants.SVG_REPEAT_DUR_ATTRIBUTE = "repeatDur";
SVGConstants.SVG_REQUIRED_FEATURES_ATTRIBUTE = "requiredFeatures";
SVGConstants.SVG_REQUIRED_EXTENSIONS_ATTRIBUTE = "requiredExtensions";
SVGConstants.SVG_RESULT_ATTRIBUTE = "result";
SVGConstants.SVG_RESULT_SCALE_ATTRIBUTE = "resultScale";
SVGConstants.SVG_RESTART_ATTRIBUTE = "restart";
SVGConstants.SVG_RX_ATTRIBUTE = "rx";
SVGConstants.SVG_RY_ATTRIBUTE = "ry";
SVGConstants.SVG_R_ATTRIBUTE = "r";
SVGConstants.SVG_ROTATE_ATTRIBUTE = "rotate";
SVGConstants.SVG_SCALE_ATTRIBUTE = "scale";
SVGConstants.SVG_SEED_ATTRIBUTE = "seed";
SVGConstants.SVG_SHAPE_RENDERING_ATTRIBUTE = CSSConstants.CSS_SHAPE_RENDERING_PROPERTY;
SVGConstants.SVG_SLOPE_ATTRIBUTE = "slope";
SVGConstants.SVG_SNAPSHOT_TIME_ATTRIBUTE = "snapshotTime";
SVGConstants.SVG_SPACE_ATTRIBUTE = "space";
SVGConstants.SVG_SPACING_ATTRIBUTE = "spacing";
SVGConstants.SVG_SPECULAR_CONSTANT_ATTRIBUTE = "specularConstant";
SVGConstants.SVG_SPECULAR_EXPONENT_ATTRIBUTE = "specularExponent";
SVGConstants.SVG_SPREAD_METHOD_ATTRIBUTE = "spreadMethod";
SVGConstants.SVG_START_OFFSET_ATTRIBUTE = "startOffset";
SVGConstants.SVG_STD_DEVIATION_ATTRIBUTE = "stdDeviation";
SVGConstants.SVG_STEMH_ATTRIBUTE = "stemh";
SVGConstants.SVG_STEMV_ATTRIBUTE = "stemv";
SVGConstants.SVG_STITCH_TILES_ATTRIBUTE = "stitchTiles";
SVGConstants.SVG_STOP_COLOR_ATTRIBUTE = "stop-color";
SVGConstants.SVG_STOP_OPACITY_ATTRIBUTE = CSSConstants.CSS_STOP_OPACITY_PROPERTY;
SVGConstants.SVG_STRIKETHROUGH_POSITION_ATTRIBUTE = "strikethrough-position";
SVGConstants.SVG_STRIKETHROUGH_THICKNESS_ATTRIBUTE = "strikethrough-thickness";
SVGConstants.SVG_STRING_ATTRIBUTE = "string";
SVGConstants.SVG_STROKE_ATTRIBUTE = CSSConstants.CSS_STROKE_PROPERTY;
SVGConstants.SVG_STROKE_DASHARRAY_ATTRIBUTE = CSSConstants.CSS_STROKE_DASHARRAY_PROPERTY;
SVGConstants.SVG_STROKE_DASHOFFSET_ATTRIBUTE = CSSConstants.CSS_STROKE_DASHOFFSET_PROPERTY;
SVGConstants.SVG_STROKE_LINECAP_ATTRIBUTE = CSSConstants.CSS_STROKE_LINECAP_PROPERTY;
SVGConstants.SVG_STROKE_LINEJOIN_ATTRIBUTE = CSSConstants.CSS_STROKE_LINEJOIN_PROPERTY;
SVGConstants.SVG_STROKE_MITERLIMIT_ATTRIBUTE = CSSConstants.CSS_STROKE_MITERLIMIT_PROPERTY;
SVGConstants.SVG_STROKE_OPACITY_ATTRIBUTE = CSSConstants.CSS_STROKE_OPACITY_PROPERTY;
SVGConstants.SVG_STROKE_WIDTH_ATTRIBUTE = CSSConstants.CSS_STROKE_WIDTH_PROPERTY;
SVGConstants.SVG_STYLE_ATTRIBUTE = "style";
SVGConstants.SVG_SURFACE_SCALE_ATTRIBUTE = "surfaceScale";
SVGConstants.SVG_SYSTEM_LANGUAGE_ATTRIBUTE = "systemLanguage";
SVGConstants.SVG_TABLE_ATTRIBUTE = "table";
SVGConstants.SVG_TABLE_VALUES_ATTRIBUTE = "tableValues";
SVGConstants.SVG_TARGET_ATTRIBUTE = "target";
SVGConstants.SVG_TARGET_X_ATTRIBUTE = "targetX";
SVGConstants.SVG_TARGET_Y_ATTRIBUTE = "targetY";
SVGConstants.SVG_TEXT_ANCHOR_ATTRIBUTE = CSSConstants.CSS_TEXT_ANCHOR_PROPERTY;
SVGConstants.SVG_TEXT_LENGTH_ATTRIBUTE = "textLength";
SVGConstants.SVG_TEXT_RENDERING_ATTRIBUTE = CSSConstants.CSS_TEXT_RENDERING_PROPERTY;
SVGConstants.SVG_TITLE_ATTRIBUTE = "title";
SVGConstants.SVG_TO_ATTRIBUTE = "to";
SVGConstants.SVG_TRANSFORM_ATTRIBUTE = "transform";
SVGConstants.SVG_TYPE_ATTRIBUTE = "type";
SVGConstants.SVG_U1_ATTRIBUTE = "u1";
SVGConstants.SVG_U2_ATTRIBUTE = "u2";
SVGConstants.SVG_UNDERLINE_POSITION_ATTRIBUTE = "underline-position";
SVGConstants.SVG_UNDERLINE_THICKNESS_ATTRIBUTE = "underline-thickness";
SVGConstants.SVG_UNICODE_ATTRIBUTE = "unicode";
SVGConstants.SVG_UNICODE_RANGE_ATTRIBUTE = "unicode-range";
SVGConstants.SVG_UNITS_PER_EM_ATTRIBUTE = "units-per-em";
SVGConstants.SVG_V_ALPHABETIC_ATTRIBUTE = "v-alphabetic";
SVGConstants.SVG_V_HANGING_ATTRIBUTE = "v-hanging";
SVGConstants.SVG_V_IDEOGRAPHIC_ATTRIBUTE = "v-ideographic";
SVGConstants.SVG_V_MATHEMATICAL_ATTRIBUTE = "v-mathematical";
SVGConstants.SVG_VALUES_ATTRIBUTE = "values";
SVGConstants.SVG_VERSION_ATTRIBUTE = "version";
SVGConstants.SVG_VERT_ADV_Y_ATTRIBUTE = "vert-adv-y";
SVGConstants.SVG_VERT_ORIGIN_X_ATTRIBUTE = "vert-origin-x";
SVGConstants.SVG_VERT_ORIGIN_Y_ATTRIBUTE = "vert-origin-y";
SVGConstants.SVG_VIEW_BOX_ATTRIBUTE = "viewBox";
SVGConstants.SVG_VIEW_TARGET_ATTRIBUTE = "viewTarget";
SVGConstants.SVG_WIDTH_ATTRIBUTE = "width";
SVGConstants.SVG_WIDTHS_ATTRIBUTE = "widths";
SVGConstants.SVG_X1_ATTRIBUTE = "x1";
SVGConstants.SVG_X2_ATTRIBUTE = "x2";
SVGConstants.SVG_X_ATTRIBUTE = "x";
SVGConstants.SVG_X_CHANNEL_SELECTOR_ATTRIBUTE = "xChannelSelector";
SVGConstants.SVG_X_HEIGHT_ATTRIBUTE = "xHeight";
SVGConstants.SVG_Y1_ATTRIBUTE = "y1";
SVGConstants.SVG_Y2_ATTRIBUTE = "y2";
SVGConstants.SVG_Y_ATTRIBUTE = "y";
SVGConstants.SVG_Y_CHANNEL_SELECTOR_ATTRIBUTE = "yChannelSelector";
SVGConstants.SVG_Z_ATTRIBUTE = "z";
SVGConstants.SVG_ZOOM_AND_PAN_ATTRIBUTE = "zoomAndPan";

/////////////////////////////////////////////////////////////////////////
// SVG attribute value
/////////////////////////////////////////////////////////////////////////

SVGConstants.SVG_100_VALUE = "100";
SVGConstants.SVG_200_VALUE = "200";
SVGConstants.SVG_300_VALUE = "300";
SVGConstants.SVG_400_VALUE = "400";
SVGConstants.SVG_500_VALUE = "500";
SVGConstants.SVG_600_VALUE = "600";
SVGConstants.SVG_700_VALUE = "700";
SVGConstants.SVG_800_VALUE = "800";
SVGConstants.SVG_900_VALUE = "900";
SVGConstants.SVG_ABSOLUTE_COLORIMETRIC_VALUE = "absolute-colorimetric";
SVGConstants.SVG_ALIGN_VALUE = "align";
SVGConstants.SVG_ALL_VALUE = "all";
SVGConstants.SVG_ARITHMETIC_VALUE = "arithmetic";
SVGConstants.SVG_ATOP_VALUE = "atop";
SVGConstants.SVG_AUTO_VALUE = "auto";
SVGConstants.SVG_A_VALUE = "A";
SVGConstants.SVG_BACKGROUND_ALPHA_VALUE = "BackgroundAlpha";
SVGConstants.SVG_BACKGROUND_IMAGE_VALUE = "BackgroundImage";
SVGConstants.SVG_BEVEL_VALUE = "bevel";
SVGConstants.SVG_BOLDER_VALUE = "bolder";
SVGConstants.SVG_BOLD_VALUE = "bold";
SVGConstants.SVG_BUTT_VALUE = "butt";
SVGConstants.SVG_B_VALUE = "B";
SVGConstants.SVG_COMPOSITE_VALUE = "composite";
SVGConstants.SVG_CRISP_EDGES_VALUE = "crispEdges";
SVGConstants.SVG_CROSSHAIR_VALUE = "crosshair";
SVGConstants.SVG_DARKEN_VALUE = "darken";
SVGConstants.SVG_DEFAULT_VALUE = "default";
SVGConstants.SVG_DIGIT_ONE_VALUE = "1";
SVGConstants.SVG_DILATE_VALUE = "dilate";
SVGConstants.SVG_DISABLE_VALUE = "disable";
SVGConstants.SVG_DISCRETE_VALUE = "discrete";
SVGConstants.SVG_DUPLICATE_VALUE = "duplicate";
SVGConstants.SVG_END_VALUE = "end";
SVGConstants.SVG_ERODE_VALUE = "erode";
SVGConstants.SVG_EVEN_ODD_VALUE = "evenodd";
SVGConstants.SVG_EXACT_VALUE = "exact";
SVGConstants.SVG_E_RESIZE_VALUE = "e-resize";
SVGConstants.SVG_FALSE_VALUE = "false";
SVGConstants.SVG_FILL_PAINT_VALUE = "FillPaint";
SVGConstants.SVG_FLOOD_VALUE = "flood";
SVGConstants.SVG_FRACTAL_NOISE_VALUE = "fractalNoise";
SVGConstants.SVG_GAMMA_VALUE = "gamma";
SVGConstants.SVG_GEOMETRIC_PRECISION_VALUE = "geometricPrecision";
SVGConstants.SVG_G_VALUE = "G";
SVGConstants.SVG_HELP_VALUE = "help";
SVGConstants.SVG_HUE_ROTATE_VALUE = "hueRotate";
SVGConstants.SVG_HUNDRED_PERCENT_VALUE = "100%";
SVGConstants.SVG_H_VALUE = "h";
SVGConstants.SVG_IDENTITY_VALUE = "identity";
SVGConstants.SVG_INITIAL_VALUE = "initial";
SVGConstants.SVG_IN_VALUE = "in";
SVGConstants.SVG_ISOLATED_VALUE = "isolated";
SVGConstants.SVG_ITALIC_VALUE = "italic";
SVGConstants.SVG_LIGHTEN_VALUE = "lighten";
SVGConstants.SVG_LIGHTER_VALUE = "lighter";
SVGConstants.SVG_LINEAR_RGB_VALUE = "linearRGB";
SVGConstants.SVG_LINEAR_VALUE = "linear";
SVGConstants.SVG_LUMINANCE_TO_ALPHA_VALUE = "luminanceToAlpha";
SVGConstants.SVG_MAGNIFY_VALUE = "magnify";
SVGConstants.SVG_MATRIX_VALUE = "matrix";
SVGConstants.SVG_MEDIAL_VALUE = "medial";
SVGConstants.SVG_MEET_VALUE = "meet";
SVGConstants.SVG_MIDDLE_VALUE = "middle";
SVGConstants.SVG_MITER_VALUE = "miter";
SVGConstants.SVG_MOVE_VALUE = "move";
SVGConstants.SVG_MULTIPLY_VALUE = "multiply";
SVGConstants.SVG_NEW_VALUE = "new";
SVGConstants.SVG_NE_RESIZE_VALUE = "ne-resize";
SVGConstants.SVG_NINETY_VALUE = "90";
SVGConstants.SVG_NONE_VALUE = "none";
SVGConstants.SVG_NON_ZERO_VALUE = "nonzero";
SVGConstants.SVG_NORMAL_VALUE = "normal";
SVGConstants.SVG_NO_STITCH_VALUE = "noStitch";
SVGConstants.SVG_NW_RESIZE_VALUE = "nw-resize";
SVGConstants.SVG_N_RESIZE_VALUE = "n-resize";
SVGConstants.SVG_OBJECT_BOUNDING_BOX_VALUE = "objectBoundingBox";
SVGConstants.SVG_OBLIQUE_VALUE = "oblique";
SVGConstants.SVG_ONE_VALUE = "1";
SVGConstants.SVG_OPAQUE_VALUE = "1";
SVGConstants.SVG_OPTIMIZE_LEGIBILITY_VALUE = "optimizeLegibility";
SVGConstants.SVG_OPTIMIZE_QUALITY_VALUE = "optimizeQuality";
SVGConstants.SVG_OPTIMIZE_SPEED_VALUE = "optimizeSpeed";
SVGConstants.SVG_OUT_VALUE = "out";
SVGConstants.SVG_OVER_VALUE = "over";
SVGConstants.SVG_PACED_VALUE = "paced";
SVGConstants.SVG_PAD_VALUE = "pad";
SVGConstants.SVG_PERCEPTUAL_VALUE = "perceptual";
SVGConstants.SVG_POINTER_VALUE = "pointer";
SVGConstants.SVG_PRESERVE_VALUE = "preserve";
SVGConstants.SVG_REFLECT_VALUE = "reflect";
SVGConstants.SVG_RELATIVE_COLORIMETRIC_VALUE = "relative-colorimetric";
SVGConstants.SVG_REPEAT_VALUE = "repeat";
SVGConstants.SVG_ROUND_VALUE = "round";
SVGConstants.SVG_R_VALUE = "R";
SVGConstants.SVG_SATURATE_VALUE = "saturate";
SVGConstants.SVG_SATURATION_VALUE = "saturation";
SVGConstants.SVG_SCREEN_VALUE = "screen";
SVGConstants.SVG_SE_RESIZE_VALUE = "se-resize";
SVGConstants.SVG_SLICE_VALUE = "slice";
SVGConstants.SVG_SOURCE_ALPHA_VALUE = "SourceAlpha";
SVGConstants.SVG_SOURCE_GRAPHIC_VALUE = "SourceGraphic";
SVGConstants.SVG_SPACING_AND_GLYPHS_VALUE = "spacingAndGlyphs";
SVGConstants.SVG_SPACING_VALUE = "spacing";
SVGConstants.SVG_SQUARE_VALUE = "square";
SVGConstants.SVG_SRGB_VALUE = "sRGB";
SVGConstants.SVG_START_VALUE = "start";
SVGConstants.SVG_STITCH_VALUE = "stitch";
SVGConstants.SVG_STRETCH_VALUE = "stretch";
SVGConstants.SVG_STROKE_PAINT_VALUE = "StrokePaint";
SVGConstants.SVG_STROKE_WIDTH_VALUE = "strokeWidth";
SVGConstants.SVG_SW_RESIZE_VALUE = "sw-resize";
SVGConstants.SVG_S_RESIZE_VALUE = "s-resize";
SVGConstants.SVG_TABLE_VALUE = "table";
SVGConstants.SVG_TERMINAL_VALUE = "terminal";
SVGConstants.SVG_TEXT_VALUE = "text";
SVGConstants.SVG_TRANSLATE_VALUE = "translate";
SVGConstants.SVG_TRUE_VALUE = "true";
SVGConstants.SVG_TURBULENCE_VALUE = "turbulence";
SVGConstants.SVG_USER_SPACE_ON_USE_VALUE = "userSpaceOnUse";
SVGConstants.SVG_V_VALUE = "v";
SVGConstants.SVG_WAIT_VALUE = "wait";
SVGConstants.SVG_WRAP_VALUE = "wrap";
SVGConstants.SVG_W_RESIZE_VALUE = "w-resize";
SVGConstants.SVG_XMAXYMAX_VALUE = "xMaxYMax";
SVGConstants.SVG_XMAXYMID_VALUE = "xMaxYMid";
SVGConstants.SVG_XMAXYMIN_VALUE = "xMaxYMin";
SVGConstants.SVG_XMIDYMAX_VALUE = "xMidYMax";
SVGConstants.SVG_XMIDYMID_VALUE = "xMidYMid";
SVGConstants.SVG_XMIDYMIN_VALUE = "xMidYMin";
SVGConstants.SVG_XMINYMAX_VALUE = "xMinYMax";
SVGConstants.SVG_XMINYMID_VALUE = "xMinYMid";
SVGConstants.SVG_XMINYMIN_VALUE = "xMinYMin";
SVGConstants.SVG_XOR_VALUE = "xor";
SVGConstants.SVG_ZERO_PERCENT_VALUE = "0%";
SVGConstants.SVG_ZERO_VALUE = "0";


///////////////////////////////////////////////////////////////////
// default values for attributes
///////////////////////////////////////////////////////////////////

SVGConstants.SVG_CIRCLE_CX_DEFAULT_VALUE = "0";
SVGConstants.SVG_CIRCLE_CY_DEFAULT_VALUE = "0";
SVGConstants.SVG_CLIP_PATH_CLIP_PATH_UNITS_DEFAULT_VALUE = SVGConstants.SVG_USER_SPACE_ON_USE_VALUE;
SVGConstants.SVG_COMPONENT_TRANSFER_FUNCTION_AMPLITUDE_DEFAULT_VALUE = "1";
SVGConstants.SVG_COMPONENT_TRANSFER_FUNCTION_EXPONENT_DEFAULT_VALUE = "1";
SVGConstants.SVG_COMPONENT_TRANSFER_FUNCTION_INTERCEPT_DEFAULT_VALUE = "0";
SVGConstants.SVG_COMPONENT_TRANSFER_FUNCTION_OFFSET_DEFAULT_VALUE = "0";
SVGConstants.SVG_COMPONENT_TRANSFER_FUNCTION_SLOPE_DEFAULT_VALUE = "1";
SVGConstants.SVG_COMPONENT_TRANSFER_FUNCTION_TABLE_VALUES_DEFAULT_VALUE = "";
SVGConstants.SVG_CURSOR_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_CURSOR_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_ELLIPSE_CX_DEFAULT_VALUE = "0";
SVGConstants.SVG_ELLIPSE_CY_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_COMPOSITE_K1_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_COMPOSITE_K2_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_COMPOSITE_K3_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_COMPOSITE_K4_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_COMPOSITE_OPERATOR_DEFAULT_VALUE = SVGConstants.SVG_OVER_VALUE;
SVGConstants.SVG_FE_CONVOLVE_MATRIX_EDGE_MODE_DEFAULT_VALUE = SVGConstants.SVG_DUPLICATE_VALUE;
SVGConstants.SVG_FE_DIFFUSE_LIGHTING_DIFFUSE_CONSTANT_DEFAULT_VALUE = "1";
SVGConstants.SVG_FE_DIFFUSE_LIGHTING_SURFACE_SCALE_DEFAULT_VALUE = "1";
SVGConstants.SVG_FE_DISPLACEMENT_MAP_SCALE_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_DISTANT_LIGHT_AZIMUTH_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_DISTANT_LIGHT_ELEVATION_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_POINT_LIGHT_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_POINT_LIGHT_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_POINT_LIGHT_Z_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_SPECULAR_LIGHTING_SPECULAR_CONSTANT_DEFAULT_VALUE = "1";
SVGConstants.SVG_FE_SPECULAR_LIGHTING_SPECULAR_EXPONENT_DEFAULT_VALUE = "1";
SVGConstants.SVG_FE_SPECULAR_LIGHTING_SURFACE_SCALE_DEFAULT_VALUE = "1";
SVGConstants.SVG_FE_SPOT_LIGHT_LIMITING_CONE_ANGLE_DEFAULT_VALUE = "90";
SVGConstants.SVG_FE_SPOT_LIGHT_POINTS_AT_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_SPOT_LIGHT_POINTS_AT_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_SPOT_LIGHT_POINTS_AT_Z_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_SPOT_LIGHT_SPECULAR_EXPONENT_DEFAULT_VALUE = "1";
SVGConstants.SVG_FE_SPOT_LIGHT_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_SPOT_LIGHT_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_SPOT_LIGHT_Z_DEFAULT_VALUE = "0";
SVGConstants.SVG_FE_TURBULENCE_NUM_OCTAVES_DEFAULT_VALUE = "1";
SVGConstants.SVG_FE_TURBULENCE_SEED_DEFAULT_VALUE = "0";
SVGConstants.SVG_FILTER_FILTER_UNITS_DEFAULT_VALUE = SVGConstants.SVG_USER_SPACE_ON_USE_VALUE;
SVGConstants.SVG_FILTER_HEIGHT_DEFAULT_VALUE = "120%";
SVGConstants.SVG_FILTER_PRIMITIVE_X_DEFAULT_VALUE = "0%";
SVGConstants.SVG_FILTER_PRIMITIVE_Y_DEFAULT_VALUE = "0%";
SVGConstants.SVG_FILTER_PRIMITIVE_WIDTH_DEFAULT_VALUE = "100%";
SVGConstants.SVG_FILTER_PRIMITIVE_HEIGHT_DEFAULT_VALUE = "100%";
SVGConstants.SVG_FILTER_PRIMITIVE_UNITS_DEFAULT_VALUE = SVGConstants.SVG_USER_SPACE_ON_USE_VALUE;
SVGConstants.SVG_FILTER_WIDTH_DEFAULT_VALUE = "120%";
SVGConstants.SVG_FILTER_X_DEFAULT_VALUE = "-10%";
SVGConstants.SVG_FILTER_Y_DEFAULT_VALUE = "-10%";
SVGConstants.SVG_FONT_FACE_FONT_STRETCH_DEFAULT_VALUE = SVGConstants.SVG_NORMAL_VALUE;
SVGConstants.SVG_FONT_FACE_FONT_STYLE_DEFAULT_VALUE = SVGConstants.SVG_ALL_VALUE;
SVGConstants.SVG_FONT_FACE_FONT_VARIANT_DEFAULT_VALUE = SVGConstants.SVG_NORMAL_VALUE;
SVGConstants.SVG_FONT_FACE_FONT_WEIGHT_DEFAULT_VALUE = SVGConstants.SVG_ALL_VALUE;
SVGConstants.SVG_FONT_FACE_PANOSE_1_DEFAULT_VALUE = "0 0 0 0 0 0 0 0 0 0";
SVGConstants.SVG_FONT_FACE_SLOPE_DEFAULT_VALUE = "0";
SVGConstants.SVG_FONT_FACE_UNITS_PER_EM_DEFAULT_VALUE = "1000";
SVGConstants.SVG_FOREIGN_OBJECT_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_FOREIGN_OBJECT_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_HORIZ_ORIGIN_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_HORIZ_ORIGIN_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_KERN_K_DEFAULT_VALUE = "0";
SVGConstants.SVG_IMAGE_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_IMAGE_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_LINE_X1_DEFAULT_VALUE = "0";
SVGConstants.SVG_LINE_X2_DEFAULT_VALUE = "0";
SVGConstants.SVG_LINE_Y1_DEFAULT_VALUE = "0";
SVGConstants.SVG_LINE_Y2_DEFAULT_VALUE = "0";
SVGConstants.SVG_LINEAR_GRADIENT_X1_DEFAULT_VALUE = "0%";
SVGConstants.SVG_LINEAR_GRADIENT_X2_DEFAULT_VALUE = "100%";
SVGConstants.SVG_LINEAR_GRADIENT_Y1_DEFAULT_VALUE = "0%";
SVGConstants.SVG_LINEAR_GRADIENT_Y2_DEFAULT_VALUE = "0%";
SVGConstants.SVG_MARKER_MARKER_HEIGHT_DEFAULT_VALUE = "3";
SVGConstants.SVG_MARKER_MARKER_UNITS_DEFAULT_VALUE = SVGConstants.SVG_STROKE_WIDTH_VALUE;
SVGConstants.SVG_MARKER_MARKER_WIDTH_DEFAULT_VALUE = "3";
SVGConstants.SVG_MARKER_ORIENT_DEFAULT_VALUE = "0";
SVGConstants.SVG_MARKER_REF_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_MARKER_REF_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_MASK_HEIGHT_DEFAULT_VALUE = "120%";
SVGConstants.SVG_MASK_MASK_UNITS_DEFAULT_VALUE = SVGConstants.SVG_USER_SPACE_ON_USE_VALUE;
SVGConstants.SVG_MASK_WIDTH_DEFAULT_VALUE = "120%";
SVGConstants.SVG_MASK_X_DEFAULT_VALUE = "-10%";
SVGConstants.SVG_MASK_Y_DEFAULT_VALUE = "-10%";
SVGConstants.SVG_PATTERN_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_PATTERN_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_PATTERN_WIDTH_DEFAULT_VALUE = "0";
SVGConstants.SVG_PATTERN_HEIGHT_DEFAULT_VALUE = "0";
SVGConstants.SVG_RADIAL_GRADIENT_CX_DEFAULT_VALUE = "50%";
SVGConstants.SVG_RADIAL_GRADIENT_CY_DEFAULT_VALUE = "50%";
SVGConstants.SVG_RADIAL_GRADIENT_R_DEFAULT_VALUE = "50%";
SVGConstants.SVG_RECT_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_RECT_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_SCRIPT_TYPE_ECMASCRIPT = "text/ecmascript";
SVGConstants.SVG_SCRIPT_TYPE_APPLICATION_ECMASCRIPT = "application/ecmascript";
SVGConstants.SVG_SCRIPT_TYPE_JAVASCRIPT = "text/javascript";
SVGConstants.SVG_SCRIPT_TYPE_APPLICATION_JAVASCRIPT = "application/javascript";
SVGConstants.SVG_SCRIPT_TYPE_DEFAULT_VALUE = SVGConstants.SVG_SCRIPT_TYPE_ECMASCRIPT;
SVGConstants.SVG_SCRIPT_TYPE_JAVA = "application/java-archive";
SVGConstants.SVG_SVG_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_SVG_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_SVG_HEIGHT_DEFAULT_VALUE = "100%";
SVGConstants.SVG_SVG_WIDTH_DEFAULT_VALUE = "100%";
SVGConstants.SVG_TEXT_PATH_START_OFFSET_DEFAULT_VALUE = "0";
SVGConstants.SVG_USE_X_DEFAULT_VALUE = "0";
SVGConstants.SVG_USE_Y_DEFAULT_VALUE = "0";
SVGConstants.SVG_USE_WIDTH_DEFAULT_VALUE = "100%";
SVGConstants.SVG_USE_HEIGHT_DEFAULT_VALUE = "100%";

///////////////////////////////////////////////////////////////////
// various constants in SVG attributes
///////////////////////////////////////////////////////////////////

SVGConstants.TRANSFORM_TRANSLATE = "translate";
SVGConstants.TRANSFORM_ROTATE    = "rotate";
SVGConstants.TRANSFORM_SCALE     = "scale";
SVGConstants.TRANSFORM_SKEWX     = "skewX";
SVGConstants.TRANSFORM_SKEWY     = "skewY";
SVGConstants.TRANSFORM_MATRIX    = "matrix";

SVGConstants.PATH_ARC                = "A";
SVGConstants.PATH_CLOSE              = "Z";
SVGConstants.PATH_CUBIC_TO           = "C";
SVGConstants.PATH_MOVE               = "M";
SVGConstants.PATH_LINE_TO            = "L";
SVGConstants.PATH_VERTICAL_LINE_TO   = "V";
SVGConstants.PATH_HORIZONTAL_LINE_TO = "H";
SVGConstants.PATH_QUAD_TO            = "Q";
SVGConstants.PATH_SMOOTH_QUAD_TO     = "T";

///////////////////////////////////////////////////////////////////
// event constants
///////////////////////////////////////////////////////////////////

SVGConstants.SVG_EVENT_CLICK     = "click";
SVGConstants.SVG_EVENT_KEYDOWN   = "keydown";
SVGConstants.SVG_EVENT_KEYPRESS  = "keypress";
SVGConstants.SVG_EVENT_KEYUP     = "keyup";
SVGConstants.SVG_EVENT_MOUSEDOWN = "mousedown";
SVGConstants.SVG_EVENT_MOUSEMOVE = "mousemove";
SVGConstants.SVG_EVENT_MOUSEOUT  = "mouseout";
SVGConstants.SVG_EVENT_MOUSEOVER = "mouseover";
SVGConstants.SVG_EVENT_MOUSEUP   = "mouseup";

