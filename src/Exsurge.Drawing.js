//
// Author(s):
// Fr. Matthew Spencer, OSJ <mspencer@osjusa.org>
//
// Copyright (c) 2008-2016 Fr. Matthew Spencer, OSJ
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

import { Units, Pitch, Point, Rect, Margins, Size, Step, MarkingPositionHint } from 'Exsurge.Core'
import { Glyphs } from 'Exsurge.Glyphs'
import { Latin } from 'Exsurge.Text'


var __syllableConnector = "-";

export let GlyphCode = {

  None: "None",

  AcuteAccent: "AcuteAccent",
  Apostropha: "Apostropha",
  //  ApostrophaLiquescent: "ApostrophaLiquescent",

  BeginningAscLiquescent: "BeginningAscLiquescent",
  BeginningDesLiquescent: "BeginningDesLiquescent",

  CustodDescLong: "CustodDescLong",
  CustodDescShort: "CustodDescShort",
  CustodLong: "CustodLong",
  CustodShort: "CustodShort",

  // clefs and other markings
  DoClef: "DoClef",
  FaClef: "FaClef",
  Flat: "Flat",
  Mora: "Mora",
  Natural: "Natural",
  OriscusAsc: "OriscusAsc",
  OriscusDes: "OriscusDes",

  PodatusLower: "PodatusLower",
  PodatusUpper: "PodatusUpper",

  Porrectus1: "Porrectus1", // 1 staff line difference,
  Porrectus2: "Porrectus2", // 2 lines difference, etc...
  Porrectus3: "Porrectus3",
  Porrectus4: "Porrectus4",

  PunctumCavum: "PunctumCavum",
  PunctumCuadratum: "PunctumCuadratum",
  PunctumCuadratumAscLiquescent: "PunctumCuadratumAscLiquescent",
  PunctumCuadratumDesLiquescent: "PunctumCuadratumDesLiquescent",
  PunctumInclinatum: "PunctumInclinatum",
  //  PunctumInclinatumLiquescent: "PunctumInclinatumLiquescent",
  Quilisma: "Quilisma",

  TerminatingAscLiquescent: "TerminatingAscLiquescent",
  TerminatingDesLiquescent: "TerminatingDesLiquescent",
  VerticalEpisemaAbove: "VerticalEpisemaAbove",
  VerticalEpisemaBelow: "VerticalEpisemaBelow",
  VirgaLong: "VirgaLong",
  VirgaShort: "VirgaShort",
  Virgula: "Virgula"
}; // GlyphCode

export var QuickSvg = {

  // namespaces  
  ns: 'http://www.w3.org/2000/svg',
  xmlns: 'http://www.w3.org/2000/xmlns/',
  xlink: 'http://www.w3.org/1999/xlink',

  // create the root level svg object
  svg: function(width, height) {
    var node = document.createElementNS(this.ns,'svg');

    node.setAttribute('xmlns', this.ns); 
    node.setAttribute('version', '1.1');
    node.setAttributeNS(this.xmlns, 'xmlns:xlink', this.xlink);

    node.setAttribute('width', width);
    node.setAttribute('height', height);

    // create the defs element
    var defs = document.createElementNS(this.ns, 'defs');
    node.appendChild(defs);

    node.defs = defs;

    node.clearNotations = function() {
      // clear out all children except defs
      node.removeChild(defs);

      while (node.hasChildNodes())
        node.removeChild(node.lastChild);
      
      node.appendChild(defs);
    }

    return node;
  },

  defs: function() {
    return node;
  },

  rect: function(width, height) {
    var node = document.createElementNS(this.ns, 'rect');

    node.setAttribute('width', width);
    node.setAttribute('height', height);

    return node;
  },

  line: function(x1, y1, x2, y2) {
    var node = document.createElementNS(this.ns, 'line');

    node.setAttribute('x1', x1);
    node.setAttribute('y1', y1);
    node.setAttribute('x2', x2);
    node.setAttribute('y2', y2);

    return node;
  },

  g: function() {
    var node = document.createElementNS(this.ns, 'g');

    return node;
  },

  text: function() {
    var node = document.createElementNS(this.ns, 'text');

    return node;
  },

  tspan: function(str) {
    var node = document.createElementNS(this.ns, 'tspan');
    node.textContent = str;

    return node;
  },

  // nodeRef should be the id of the object in defs (without the #)
  use: function(nodeRef) {
    var node = document.createElementNS(this.ns, 'use');
    node.setAttributeNS(this.xlink, "xlink:href", '#' + nodeRef);

    return node;
  },

  createFragment: function(name, attributes, child) {
    if (child === undefined || child === null)
      child = '';

    var fragment = '<' + name + ' ';

    for (var attr in attributes)
      fragment += attr + '="' + attributes[attr] + '" ';

    fragment += '>' + child + '</' + name + '>';

    return fragment;
  },

  parseFragment: function(fragment) {

    // create temporary holder
    var well = document.createElement('svg');

    // act as a setter if svg is given
    if (fragment) {

      var container = this.g();

      // dump raw svg
      // do this to allow the browser to automatically create svg nodes?
      well.innerHTML = '<svg>' + fragment.replace(/\n/, '').replace(/<(\w+)([^<]+?)\/>/g, '<$1$2></$1>') + '</svg>'

      // transplant nodes
      for (var i = 0, il = well.firstChild.childNodes.length; i < il; i++)
        container.appendChild(well.firstChild.firstChild)
      
      return container;
    }
  },

  translate: function(node, x, y) {
    node.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    return node;
  },

  scale: function(node, sx, sy) {
    node.setAttribute('transform', 'scale(' + sx + ',' + sy + ')');
    return node;
  }
}

/*
 * ChantContext
 */
export class ChantContext {

  constructor() {

    this.defs = {};

    // font styles
    this.lyricTextSize = 16; // in points?
    this.lyricTextFont = 'Minion Pro';
    this.lyricTextColor = "#000";
    
    this.dropCapTextSize = 64;
    this.dropCapTextFont = this.lyricTextFont;
    this.dropCapTextColor = this.lyricTextColor;
    
    this.annotationTextSize = 13;
    this.annotationTextFont = this.lyricTextFont;
    this.annotationTextColor = this.lyricTextColor;

    // everything depends on the scale of the punctum
    this.glyphPunctumWidth = Glyphs.PunctumCuadratum.bounds.width;
    this.glyphPunctumHeight = Glyphs.PunctumCuadratum.bounds.height;

    // fixme: for now, we just set these using the glyph scales as noted above, presuming a
    // staff line size of 0.5 in. Really what we should do is scale the punctum size based
    // on the text metrics, right? 1 punctum ~ x height size?
    this.glyphScaling = 1.0 / 16.0; 

    this.staffInterval = this.glyphPunctumWidth * this.glyphScaling;
    this.staffLineWeight = this.glyphPunctumWidth * this.glyphScaling / 8;
    this.neumeLineWeight = this.glyphPunctumWidth * this.glyphScaling / 8; // the weight of connecting lines in the glyphs.
    this.dividerLineWeight = this.neumeLineWeight; // of quarter bar, half bar, etc.
    this.episemaLineWeight = this.neumeLineWeight; // of horizontal episemae

    // for keeping track of the clef
    this.activeClef = null;

    this.staffLineColor = "#000";
    this.dividerLineColor = "#000";

    this.defaultLanguage = new Latin();

    // compile the paths objects for the glyphs so we can render them quickly to the canvas
    for (var glyphName in Glyphs) {
      var glyph = Glyphs[glyphName];

      for (var i = 0; i < glyph.paths.length; i++)
        glyph.paths[i].path2D = new Path2D(glyph.paths[i].data);
    }

    this.svgTextMeasurer = QuickSvg.svg(1,1);
    this.svgTextMeasurer.setAttribute('id', "TextMeasurer");
    document.querySelector('body').appendChild(this.svgTextMeasurer);

    // measure the size of a hyphen for the lyrics
    var hyphen = new Lyric(this, "-", LyricType.SingleSyllable);
    this.hyphenWidth = hyphen.bounds.width;

    this.minLyricWordSpacing = this.hyphenWidth;

    this.intraNeumeSpacing = this.staffInterval / 2.0;

    // for connecting neume syllables...
    this.syllableConnector = '-';

    this.drawGuides = false;
    this.drawDebuggingBounds = true;

    // chant notation elements are normally separated by a minimum fixed amount of space
    // on the staff line. It can happen, however, that two text elements are almost close
    // enough to merge, only to be separated much more by the required hyphen (or other
    // connecting string).
    //
    // This tolerance value allows a little bit of flexibility to merge two close lyrical
    // elements, thus bringing the chant notation elements a bit closer than otherwise
    // would be normally allowed.
    //
    // condensing tolerance is a percentage value (0.0-1.0, inclusive) that indicates
    // how much the default spacing can shrink. E.g., a value of 0.80 allows the layout
    // engine to separate two glyphs by only 80% of the normal inter-neume spacing value.
    //
    // fixme: condensing tolerance is not implemented yet!
    this.condensingTolerance = 0.9;
  }

  calculateHeightFromStaffPosition(staffPosition) {
    return -staffPosition * this.staffInterval;
  }
}


/*
 * ChantLayoutElement
 */
export class ChantLayoutElement {

  constructor() {

    this.bounds = new Rect();
    this.origin = new Point(0, 0);

    this.selected = false;
    this.highlighted = false;
  }

  // draws the element an html5 canvas
  draw(ctxt) {

  }

  // returns svg code for the element, used for printing support
  createDrawable(ctxt) {
    throw "ChantLayout Elements must implement createDrawable(ctxt)";
  }
}


export class DividerLineVisualizer extends ChantLayoutElement {

  constructor(ctxt, staffPosition0, staffPosition1) {
    super();

    var y0 = ctxt.calculateHeightFromStaffPosition(staffPosition0);
    var y1 = ctxt.calculateHeightFromStaffPosition(staffPosition1);

    if (y0 > y1) {
      var temp = y0;
      y0 = y1;
      y1 = temp;
    }

    this.bounds.x = 0;
    this.bounds.y = y0;
    this.bounds.width = ctxt.dividerLineWeight;
    this.bounds.height = y1 - y0;

    this.origin.x = this.bounds.width / 2;
    this.origin.y = y0;
  }

  createDrawable(ctxt) {

    return QuickSvg.createFragment('rect', {
      'x': this.bounds.x,
      'y': this.bounds.y,
      'width': ctxt.dividerLineWeight,
      'height': this.bounds.height,
      'fill': ctxt.dividerLineColor,
      'class': 'DividerLine'
    });
  }
}

export class NeumeLineVisualizer extends ChantLayoutElement {

  constructor(ctxt, note0, note1, hanging) {
    super();

    var y0 = ctxt.calculateHeightFromStaffPosition(note0.staffPosition);
    var y1 = ctxt.calculateHeightFromStaffPosition(note1.staffPosition);

    if (y0 > y1) {
      var temp = y0;
      y0 = y1;
      y1 = temp;
    }

    if (hanging)
      y1 += ctxt.glyphPunctumHeight * ctxt.glyphScaling / 2.2;

    this.bounds.x = 0;
    this.bounds.y = y0;
    this.bounds.width = ctxt.neumeLineWeight;
    this.bounds.height = y1 - y0;

    this.origin.x = 0;
    this.origin.y = 0;
  }

  createDrawable(ctxt) {

    return QuickSvg.createFragment('rect', {
      'x': this.bounds.x,
      'y': this.bounds.y,
      'width': ctxt.neumeLineWeight,
      'height': this.bounds.height,
      'fill': ctxt.neumeLineColor,
      'class': 'NeumeLine'
    });
  }
}



export class HorizontalEpisemaLineVisualizer extends ChantLayoutElement {

  constructor(ctxt, boundsToMark, position) {
    super();

    var y = 0;
    var minDistanceAway = ctxt.staffInterval * 0.4; // min distance both from neume and staff lines

    if (position == MarkingPositionHint.Below) {
      y = boundsToMark.y + boundsToMark.height + minDistanceAway; // the highest the line could be at

      // now, just take a step or two up if we need to
      if (Math.abs(y % ctxt.staffInterval) < minDistanceAway)
        y += minDistanceAway - Math.abs(y % ctxt.staffInterval);
    } else {
      y = boundsToMark.y - minDistanceAway; // the lowest the line could be at

      // now, just take a step or two up if we need to
      if (Math.abs(y % ctxt.staffInterval) < minDistanceAway)
        y -= minDistanceAway - Math.abs(y % ctxt.staffInterval);
    }

    this.bounds.x = boundsToMark.x;
    this.bounds.y = y - ctxt.episemaLineWeight / 2;
    this.bounds.width = boundsToMark.width;
    this.bounds.height = ctxt.episemaLineWeight;

    this.origin.x = 0;
    this.origin.y = 0;
  }

  createDrawable(ctxt) {
    // fixme: implement this
    //this.drawable = QuickSvg.rect(this.bounds.width, this.bounds.height);
    //QuickSvg.translate(this.drawable, this.bounds.x, this.bounds.y).classList.add('HorizontalEpisema');

    return "";
  }
}


export class GlyphVisualizer extends ChantLayoutElement {

  constructor(ctxt, glyphCode) {
    super();

    this.glyph = null;

    this.setGlyphShape(ctxt, glyphCode);
  }

  setGlyphShape(ctxt, glyphCode) {

    if (this.glyphCode == glyphCode)
      return;

    if (typeof glyphCode === 'undefined' || glyphCode == null || glyphCode == "")
      this.glyphCode = GlyphCode.None;
    else
      this.glyphCode = glyphCode;

    this.glyph = Glyphs[this.glyphCode];

    // if this glyph hasn't been used yet, then load it up in the defs section for sharing
    if (!ctxt.defs.hasOwnProperty(this.glyphCode)) {
      var glyphSrc = this.glyph.svgSrc;

      // create the ref
      ctxt.defs[this.glyphCode] = QuickSvg.createFragment('g', {
        id: this.glyphCode,
        'class': 'glyph',
        transform: 'scale(' + ctxt.glyphScaling + ')'
      }, glyphSrc);
    }


    this.origin.x = this.glyph.origin.x * ctxt.glyphScaling;
    this.origin.y = this.glyph.origin.y * ctxt.glyphScaling;

    this.bounds.x = -this.origin.x;
    this.bounds.y = -this.origin.y;
    this.bounds.width = this.glyph.bounds.width * ctxt.glyphScaling;
    this.bounds.height = this.glyph.bounds.height * ctxt.glyphScaling;
  }

  setStaffPosition(ctxt, staffPosition) {
    this.bounds.y += ctxt.calculateHeightFromStaffPosition(staffPosition);
  }

  createDrawable(ctxt) {

    return QuickSvg.createFragment('use', {
      'xlink:href': '#' + this.glyphCode,
      x: this.bounds.x + this.origin.x,
      y: this.bounds.y + this.origin.y
    });
  }
}

var TextSpan = function(text, cssClasses) {
  if (typeof cssClasses === 'undefined' || cssClasses == null)
    cssClasses = "";

  this.text = text;
  this.cssClasses = cssClasses;
};

var boldMarkup = "*";
var italicMarkup = "_";
var redMarkup = "^";
var smallCapsMarkup = "%";

function MarkupStackFrame(symbol, startIndex, cssClass) {
  this.symbol = symbol;
  this.startIndex = startIndex;
  this.cssClass = cssClass;
}

MarkupStackFrame.createStackFrame = function(symbol, startIndex) {

  var cssClass = "";

  switch(symbol) {
    case boldMarkup:
      cssClass = 'bold';
      break;
    case italicMarkup:
      cssClass = 'italic';
      break;
    case redMarkup:
      cssClass = 'red';
      break;
    case smallCapsMarkup:
      cssClass = 'small-caps';
      break;
  }

  return new MarkupStackFrame(symbol, startIndex, cssClass);
};


export class TextElement extends ChantLayoutElement {

  constructor(ctxt, text, fontFamily, fontSize, textAnchor) {
    super();

    // set these to some sane values for now...
    this.bounds.x = 0;
    this.bounds.y = 0;
    this.bounds.width = 0;
    this.bounds.height = 0;
    this.origin.x = 0;
    this.origin.y = 0;

    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.textAnchor = textAnchor;

    this.generateSpansFromText(text);

    this.recalculateMetrics(ctxt);
  }

  generateSpansFromText(text) {

    this.unsanitizedText = text;
    this.text = "";
    this.spans = [];

    // save ourselves a lot of grief for a very common text:
    if (this.text == "*") {
      this.spans.push(new TextSpan(text, ""));
      return;
    }

    var markupStack = [];
    var spanStartIndex = 0;

    var that = this;
    var closeSpan = function (spanText, extraCssClass) {
      if (spanText == "")
        return;

      that.text += spanText;

      var cssClasses = "";
      for (var i = 0; i < markupStack.length; i++) {
        if (cssClasses != "")
          cssClasses += " ";

        cssClasses = cssClasses + markupStack[i].cssClass;
      }

      if (extraCssClass != null) {
        if (cssClasses != "")
          cssClasses += " ";

        cssClasses = cssClasses + extraCssClass;
      }

      that.spans.push(new TextSpan(spanText, cssClasses));
    };

    var markupRegex = /(\*|_|\^|%|[ARVarv]\/\.)/g;

    var match = null;
    while (match = markupRegex.exec(text)) {

      var markupSymbol = match[0];

      // non-matching symbols first
      if (markupSymbol == "A/." || markupSymbol == "R/." || markupSymbol == "V/." ||
          markupSymbol == "a/." || markupSymbol == "r/." || markupSymbol == "v/.") {
        closeSpan(text[match.index] + ".", 'special-chant-character red');
      } else if (markupStack.length == 0) {
        // otherwise we're dealing with matching markup delimeters
        // if this is our first markup frame, then just create an inline for preceding text and push the stack frame
        closeSpan(text.substring(spanStartIndex, match.index));
        markupStack.push(MarkupStackFrame.createStackFrame(markupSymbol, match.index));
      } else {

        if (markupStack[markupStack.length - 1].symbol == markupSymbol) {
          // group close
          closeSpan(text.substring(spanStartIndex, match.index));
          markupStack.pop();
        } else if (markupStack.filter((frame) => frame.Symbol == markupSymbol).length > 0) {
          // trying to open a recursive group (or forgot to close a previous group)
          // in either case, we just unwind to the previous stack frame
          spanStartIndex = markupStack[markupStack.length - 1].startIndex;
          markupStack.pop();
          continue;
        } else {
          // group open
          closeSpan(text.substring(spanStartIndex, match.index));
          markupStack.push(MarkupStackFrame.createStackFrame(markupSymbol, match.index));
        }
      }

      // advance the start index past the current markup
      spanStartIndex = match.index + markupSymbol.length;
    }

    // if we finished matches, and there is still some text left, create one final run
    if (spanStartIndex < text.length)
      closeSpan(text.substring(spanStartIndex, text.length));

    // if after all of that we still didn't create any runs, then just add the entire text
    // string itself as a run
    if (this.spans.length == 0)
      closeSpan(text);
  }

  recalculateMetrics(ctxt) {

    this.bounds.x = 0;
    this.bounds.y = 0;

    ctxt.svgTextMeasurer.innerHTML = this.createDrawable(ctxt);
    var bbox = ctxt.svgTextMeasurer.firstChild.getBBox();

    this.bounds.x = 0;
    this.bounds.y = 0;
    this.bounds.width = bbox.width;
    this.bounds.height = bbox.height;
    this.origin.x = 0;
    this.origin.y = 0; // baseline?
  }

  getCssClasses() {
    return "TextElement";
  }

  createDrawable(ctxt) {

    var spans = ""

    for (var i = 0; i < this.spans.length; i++) {
      var options = {};

      if (this.spans[i].cssClasses)
        options['class'] = this.spans[i].cssClasses;

      spans += QuickSvg.createFragment('tspan', options, this.spans[i].text);
    }

    return QuickSvg.createFragment('text', {
      'transform': 'translate(' + this.bounds.x + ',' + this.bounds.y + ')',
      'class': this.getCssClasses(),
      'font-family': this.fontFamily,
      'font-size': this.fontSize,
      'text-anchor': this.textAnchor
    }, spans);
  }
}

export var LyricType = {
  SingleSyllable: 0,
  BeginningSyllable: 1,
  MiddleSyllable: 2,
  EndingSyllable: 3,

  Directive: 4 // for asterisks, "ij." elements, or other performance notes.
};

export class Lyric extends TextElement {
  constructor(ctxt, text, lyricType) {
    super(ctxt, text, ctxt.lyricTextFont, ctxt.lyricTextSize, 'start');

    this.cssClasses += " Lyric";

    if (typeof lyricType === 'undefined' || lyricType == null || lyricType == "")
      this.lyricType = LyricType.SingleSyllable;
    else
      this.lyricType = lyricType;

    this.needsConnector = false;
  }

  allowsConnector() {
    return this.lyricType == LyricType.BeginningSyllable ||
            this.lyricType == LyricType.MiddleSyllable;
  }

  setNeedsConnector(needs) {
    if (needs === true) {
      this.needsConnector = true;
      this.bounds.width = this.widthWithConnector;

      if (this.spans.length > 0)
        this.spans[this.spans.length - 1].text = this.lastSpanTextWithConnector;
    } else {
      this.needsConnector = false;
      this.bounds.width = this.widthWithoutConnector;

      if (this.spans.length > 0)
        this.spans[this.spans.length - 1].text = this.lastSpanText;
    }
  }

  generateSpansFromText(text) {
    super.generateSpansFromText(text);

    if (this.spans.length > 0) {
      this.lastSpanText = this.spans[this.spans.length - 1].text;
      this.lastSpanTextWithConnector = this.lastSpanText + __syllableConnector;
    } else {
      this.lastSpanText = "";
      this.lastSpanTextWithConnector = "";
    }
  }

  recalculateMetrics(ctxt) {
    super.recalculateMetrics(ctxt);

    this.widthWithoutConnector = this.bounds.width;
    this.textWithConnector = this.text + __syllableConnector;

    this.widthWithConnector = this.bounds.width + ctxt.hyphenWidth;

    var activeLanguage = ctxt.defaultLanguage;

    // calculate the point where the text lines up to the staff notation
    // and offset the rect that much
    var offset = 0;

    if (this.lyricType != LyricType.Directive) {

      // Non-directive elements are lined up to the chant notation based on vowel segments.
      // First we determine the vowel segment of the text, then we calculate the center point
      // of that vowel segment.
      var result = activeLanguage.findVowelSegment(this.text, 0);
      if (result.found === true) {

        // svgTextMeasurer still has the current lyric in it...
        

        var x1 = ctxt.svgTextMeasurer.firstChild.getSubStringLength(0, result.startIndex);
        var x2 = ctxt.svgTextMeasurer.firstChild.getSubStringLength(0, result.startIndex + result.length);

        offset = x1 + (x2 - x1) / 2;
      } else {
        // no vowels found according the text's language. for now we just center the text
        offset = this.widthWithoutConnector / 2;
      }

    } else {
      // directives are always centered on the chant notation
      offset = this.widthWithoutConnector / 2;
    }

    this.bounds.x = -offset;
    this.bounds.y = 0;

    this.origin.x = offset;

    this.bounds.width = this.widthWithoutConnector;
    this.bounds.height = ctxt.lyricTextSize;
  }

  getCssClasses() {

    var classes = "Lyric ";

    if (this.lyricType == LyricType.Directive)
      classes += "directive ";

    return classes + super.getCssClasses();
  }

  createDrawable(ctxt) {
    if (this.spans.length > 0) {
      if (this.needsConnector)
        this.spans[this.spans.length - 1].text = this.lastSpanTextWithConnector;
      else
        this.spans[this.spans.length - 1].text = this.lastSpanText;
    }

    return super.createDrawable(ctxt);
  }
}

export class DropCap extends TextElement {

  /**
   * @param {String} text
   */
  constructor(ctxt, text) {
    super(ctxt, text, ctxt.dropCapTextFont, ctxt.dropCapTextSize, 'middle');

    this.padding = ctxt.staffInterval * 2;
  }

  getCssClasses() {
    return "DropCap " + super.getCssClasses();
  }
}

export class Annotation extends TextElement {

  /**
   * @param {String} text
   */
  constructor(ctxt, text) {
    super(ctxt, text, ctxt.annotationTextFont, ctxt.annotationTextSize, 'middle');
    this.padding = ctxt.staffInterval * 2;
  }

  getCssClasses() {
    return "Annotation " + super.getCssClasses();
  }
}



export class ChantNotationElement extends ChantLayoutElement {

  constructor() {
    super();

    //double
    this.leadingSpace = 0.0;
    this.trailingSpace = -1; // if less than zero, this is automatically calculated at layout time
    this.keepWithNext = false;

    this.lyric = null;

    this.score = null; // the ChantScore
    this.line = null; // the ChantLine

    this.visualizers = [];
  }

  hasLyric() {
    if (this.lyric != null)
      return true;
    else
      return false;
  }

  getLyricLeft() {
    return this.bounds.x + this.lyric.bounds.x;
  }

  getLyricRight() {
    return this.bounds.x + this.lyric.bounds.x + this.lyric.bounds.width;
  }

  // used by subclasses while building up the chant notations.
  addVisualizer(chantLayoutElement) {
    if (this.bounds.isEmpty())
      this.bounds = chantLayoutElement.bounds.clone();
    else
      this.bounds.union(chantLayoutElement.bounds);

    this.visualizers.push(chantLayoutElement);
  }

  // chant notation elements are given an opportunity to perform their layout via this function.
  // subclasses should call this function first in overrides of this function.
  // on completion, exsurge presumes that the bounds, the origin, and the drawable objects are
  // all valid and prepared for higher level layout.
  performLayout(ctxt) {

    if (this.trailingSpace < 0)
      this.trailingSpace = ctxt.intraNeumeSpacing * 4;

    // reset the bounds and the staff notations before doing a layout
    this.visualizers = [];
    this.bounds = new Rect(Infinity, Infinity, -Infinity, -Infinity);

    if (this.hasLyric())
      this.lyric.recalculateMetrics(ctxt);
  }

  // a helper function for subclasses to call after they are done performing layout...
  finishLayout(ctxt) {
    this.origin.x -= -this.bounds.x;
    this.bounds.x = 0;
    //this.bounds.y = 0;

    // add the lyric and line it up
    if (this.hasLyric())
      this.lyric.bounds.x = this.origin.x - this.lyric.origin.x;
  }

  createDrawable(ctxt) {
    var inner = "";

    for (var i = 0; i < this.visualizers.length; i++)
      inner += this.visualizers[i].createDrawable(ctxt);

    if (this.lyric)
      inner += this.lyric.createDrawable(ctxt);

    return QuickSvg.createFragment('g', {
      'class': 'ChantNotationElement ' + this.constructor.name,
      'transform': 'translate(' + this.bounds.x + ',' + 0 + ')'
    }, inner);
  }
}