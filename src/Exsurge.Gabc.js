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
import { LyricType, Lyric, DropCap } from 'Exsurge.Drawing'
import { Note, NoteShape, ChantScore, ChantDocument, Clef, DoClef, FaClef, ChantLineBreak } from 'Exsurge.Chant'
import * as Markings from 'Exsurge.Chant.Markings'
import * as Signs from 'Exsurge.Chant.Signs'
import * as Neumes from 'Exsurge.Chant.Neumes'
import { ctxt } from 'Exsurge.Drawing'



// reusable reg exps
var __syllablesRegex = /(?=.)((?:[^(])*)(?:\(?([^)]*)\)?)?/g;
var __notationsRegex = /z0|z|Z|::|:|;|,|`|c1|c2|c3|c4|f3|f4|cb3|cb4|\/\/|\/|\!|[a-mA-M][owWvVrRsxy#~\+><_\.'012345]*/g;

export var Gabc = {

  loadChantScore: function (ctxt, gabcNotations, createDropCap) {

    var score = new ChantScore();

    // fixme: no dropcap until the text engine is working again
    this.parseChantNotations(ctxt, gabcNotations, score, createDropCap);

    score.prepareNotesForAudio();

    return score;
  },

  parseChantNotations: function (ctxt, gabcNotations, score, createDropCap) {

    score.notations = [];

    var passByRef = {
      activeClef: null
    };

    // split the notations on whitespace boundaries
    var words = gabcNotations.match(/\S+/g);

    for (var i = 0; i < words.length; i++) {
      var word = words[i];

      var currSyllable = 0;

      if (word == '')
        continue;

      word = word.trim()

      var matches = [];
      
      while (match = __syllablesRegex.exec(word))
        matches.push(match);

      for (var j = 0; j < matches.length; j++) {
        var match = matches[j];

        var lyricText = match[1].trim();
        var notationData = match[2];

        var items = this.createNotations(ctxt, score, notationData, passByRef);

        if (items.length == 0)
          continue;

        // if we are to create a dropCap and we haven't done so yet, do it now
        if (createDropCap && score.dropCap == null && lyricText != "") {
          score.dropCap = new DropCap(ctxt, lyricText.substring(0, 1));
          lyricText = lyricText.substring(1);
        }

        // create lyric if we have it...
        if (lyricText != "") {

          var lyricType;
          if (currSyllable == 0 && matches.length == 1)
            lyricType = LyricType.SingleSyllable;
          else if (currSyllable == 0 && matches.length > 1)
            lyricType = LyricType.BeginningSyllable;
          else if (currSyllable == matches.length - 1)
            lyricType = LyricType.EndingSyllable;
          else
            lyricType = LyricType.MiddleSyllable;

          // add the lyrics to the first notation that makes sense...
          var notationWithLyrics = null;
          for (var k = 0; k < items.length; k++) {
            var cne = items[k];
            if (cne.constructor.name == "Accidental")
              continue;

            notationWithLyrics = cne;
            break;
          }

          // if it's not a neume then make the lyric a directive
          if (notationWithLyrics.notes == null)
            lyricType = LyricType.Directive;

          var lyric = this.makeLyric(ctxt, lyricText, lyricType);

          // also, new words reset the accidentals, per the Solesmes style (see LU xviij)
          if (lyric.lyricType == LyricType.BeginningSyllable ||
            lyric.lyricType == LyricType.SingleSyllable)
            passByRef.activeClef.resetAccidentals();

          // fixme: lyrics are broken! for now, just ignore them
          notationWithLyrics.lyric = lyric;
        }

        score.notations = score.notations.concat(items);

        currSyllable++;
      }
    }
  },

  makeLyric: function (ctxt, text, lyricType) {

    if (text.length > 1 && text[text.length - 1] == '-') {
      if (lyricType == LyricType.EndingSyllable)
        lyricType = LyricType.MiddleSyllable;
      else if (lyricType == LyricType.SingleSyllable)
        lyricType = LyricType.BeginningSyllable;

      text = text.substring(0, text.length - 1);
    }

    var elides = false;
    if (text.length > 1 && text[text.length - 1] == '_') {
      // must be an elision
      elides = true;
      text = text.substring(0, text.length - 1);
    }

    // replace special gabc characters
    text = text.replace("<sp>R/</sp>", "R/");
    text = text.replace("<sp>V/</sp>", "V/");

    // check for italic/bold in the silliest way possible
    // only works if italic is the outer tag
    var italic = false;
    if (text.startsWith('<i>') && text.endsWith('</i>')) {
      text = text.substring(3, text.length - 4);
      italic = true;
    }

    var bold = false;
    if (text.startsWith('<b>') && text.endsWith('</b>')) {
      text = text.substring(3, text.length - 4);
      bold = true
    }

    var s = new Lyric(ctxt, text, lyricType);
    s.elidesToNext = elides;

    if (italic)
      s.italic = true;
    
    if (bold)
      s.bold = true;

    // a hack to make the response/versicle characters work...
    //if (text.search('℟') >= 0 || text.search('℣') >= 0)
    //  s.NativeText.font = new Font("Arial Unicode MS");

    return s;
  },

  createNotations: function (ctxt, score, data, passByRef) {

    var notations = [];

    // if there is no data, then this must be a text only object
    if (data === undefined || data === null || data === "") {
      notations.push(new Neumes.TextOnly());
      return notations;
    }

    var notes = [];
    var out = { trailingSpace: -1 };

    var that = this;
    var addNotation = function(notation) {

      // first, if we have any notes left over, we create a neume out of them
      if (notes.length > 0) {
        // create neume(s)

        var neumes = that.createNeumesFromNotes(ctxt, score, notes, out.trailingSpace);
        for (var i = 0; i < neumes.length; i++)
          notations.push(neumes[i]);

        // reset the trailing space
        out.trailingSpace = -1;

        notes = [];
      }

      // then, if we're passed a notation, let's add it
      // also, perform chant logic here
      if (notation != null) {

        if (notation.isClef) {
          if (score.startingClef == null) {
            score.startingClef = notation;
            return;
          }
        } else if (notation.isAccidental)
          passByRef.activeClef.activeAccidental = notation;
        else if (notation.resetsAccidentals)
          passByRef.activeClef.resetAccidentals();

          notations.push(notation);
      }
    };

    var atoms = data.match(__notationsRegex);

    for (var i = 0; i < atoms.length; i++) {

      var atom = atoms[i], lineBreak = null;

      // handle the clefs and dividers here
      switch (atom) {
        case ",":
          addNotation(new Signs.QuarterBar());
          break;
        case "`":
          addNotation(new Signs.Virgula());
          break;
        case ";":
          addNotation(new Signs.HalfBar());
          break;
        case ":":
          addNotation(new Signs.FullBar());
          break;
        case "::":
          addNotation(new Signs.DoubleBar());
          break;
          // other gregorio dividers are not supported

        case "c1":
          passByRef.activeClef = new DoClef(-3, 2);
          addNotation(passByRef.activeClef);
          break;

        case "c2":
          passByRef.activeClef = new DoClef(-1, 2);
          addNotation(passByRef.activeClef);
          break;

        case "c3":
          passByRef.activeClef = new DoClef(1, 2);
          addNotation(passByRef.activeClef);
          break;

        case "c4":
          passByRef.activeClef = new DoClef(3, 2);
          addNotation(passByRef.activeClef);
          break;

        case "f3":
          passByRef.activeClef = new FaClef(1, 2);
          addNotation(passByRef.activeClef);
          break;

        case "f4":
          passByRef.activeClef = new FaClef(3, 2);
          addNotation(passByRef.activeClef);
          break;

        case "cb3":
          passByRef.activeClef = new DoClef(1, 2);
          passByRef.activeClef.defaultAccidental = new Accidental(Step.Te, passByRef.activeClef.octave, Signs.AccidentalType.Flat);
          addNotation(passByRef.activeClef);
          break;

        case "cb4":
          passByRef.activeClef = new DoClef(3, 2);
          passByRef.activeClef.defaultAccidental = new Accidental(Step.Te, passByRef.activeClef.octave, Signs.AccidentalType.Flat);
          addNotation(passByRef.activeClef);
          break;

          case "z":
            lineBreak = new ChantLineBreak(true);
            addNotation(lineBreak);
            break;
          case "Z":
            lineBreak = new ChantLineBreak(false);
            addNotation(lineBreak);
            break;
          case "z0":
            // unsupported for now...
            break;

          // spacing indicators
          case "!":
            out.trailingSpace = 0;
            addNotation(null);
            break;
          case "/":
            out.trailingSpace = ctxt.intraNeumeSpacing;
            addNotation(null);
            break;
          case "//":
            out.trailingSpace = ctxt.intraNeumeSpacing * 2;
            addNotation(null);
            break;


          default:
            // might be a custod, might be an accidental, or might be a note
            if (atom.length > 1 && atom[1] == '+') {
              // custod
              var custod = new Custod();

              custod.note = new Note(this.convertGabcStaffPositionToScribamPitch(passByRef.activeClef, data[0]));

              addNotation(custod);

            } else if (atom.length > 1 && (atom[1] == 'x' || atom[1] == 'y' || atom[1] == '#')) {

              var accidentalType;

              switch (atom[1]) {
                case 'y':
                  accidentalType = Signs.AccidentalType.Natural;
                  break;
                case '#':
                  accidentalType = Signs.AccidentalType.Sharp;
                  break;
                default:
                  accidentalType = Signs.AccidentalType.Flat;
                  break;
              }

              var note = this.createNoteFromData(passByRef.activeClef, atom);
              var accidental = new Signs.Accidental(note.staffPosition, accidentalType);
              accidental.trailingSpace = ctxt.intraNeumeSpacing * 2;

              passByRef.activeClef.activeAccidental = accidental;
              
              addNotation(accidental);
            } else {

              // to make our interpreter more robust, make sure we have a clef to work with
              if (passByRef.activeClef == null)
                passByRef.activeClef = new DoClef(1, 2);

              // looks like it's a note
              notes.push(this.createNoteFromData(passByRef.activeClef, atom));
            }
            break;
      }
    }

    // finish up any remaining notes we have left
    addNotation(null);

    return notations;
  },

  createNeumesFromNotes: function (ctxt, score, notes, finalTrailingSpace) {
    
    var neumes = [];
    var intraNeumeSpacing = ctxt.intraNeumeSpacing;

    var prevNote = null, currNote = null;
    var firstNoteIndex = 0;
    var currNoteIndex = 0;

    // here we use a simple finite state machine to create the neumes from the notes
    // createNeume is helper function which returns the next state after a neume is created
    // (unknownState). Each state object has a neume() function and a handle() function.
    // neume() allows us to create the neume of the state in the event that we run out
    // of notes. handle() gives the state an opportunity to examine the currNote and
    // determine what to do...either transition to a different neume/state, or
    // continue building the neume of that state. handle() returns the next state

    var createNeume = function (neume, includeCurrNote) {

      // add the notes to the neume
      var lastNoteIndex = includeCurrNote ? currNoteIndex : currNoteIndex - 1;
      for (var i = firstNoteIndex; i <= lastNoteIndex; i++)
        neume.notes.push(notes[i]);

      neumes.push(neume);

      if (includeCurrNote === false) {
        firstNoteIndex = currNoteIndex;
        currNoteIndex--;
        neume.keepWithNext = true;
        neume.trailingSpace = intraNeumeSpacing;
      }

      return unknownState;
    };

    var unknownState = {
      neume: function() {
        return new Punctum();
      },
      handle: function(currNote, prevNote) {
      
        switch (currNote.shape) {
          case NoteShape.Apostropha:
            return apostrophaState;
          case NoteShape.Cavum:
            return createNeume(new Punctum(), true);
          case NoteShape.OriscusAscending:
            break;
          case NoteShape.OriscusDescending:
            break;
          case NoteShape.Virga:
            return virgaState;
          default:
            return punctumState;
        }
      }
    };

    var punctumState = {
      neume: function() {
        return new Neumes.Punctum();
      },
      handle: function(currNote, prevNote) {
        
        if (currNote.staffPosition > prevNote.staffPosition)
          return podatusState;
        else if (currNote.staffPosition < prevNote.staffPosition) {
          if (currNote.shape == NoteShape.Inclinatum)
            return climacusState;
          else
            return clivisState;
        } else
          return distrophaState;
      }
    };

    var oriscusState = {
      neume: function() {
        return new Neumes.Oriscus();
      },
      handle: function(currNote, prevNote) {
        
        if (currNote.shape == NoteShape.Default && currNote.staffPosition > prevNote.staffPosition)
          return podatusState;
        else
          // stand alone oriscus
          return createNeume(new Neumes.Oriscus(), true);
      }
    };

    var podatusState = {
      neume: function() {
        return new Neumes.Podatus();
      },
      handle: function(currNote, prevNote) {

        if (currNote.staffPosition > prevNote.staffPosition) {
          return scandicusState;
        } else if (currNote.staffPosition < prevNote.staffPosition) {
          if (currNote.shape == NoteShape.Inclinatum)
            return pesSubpunctisState;
          else
            return torculusState;
        } else
          return createNeume(new Neumes.Podatus(), false);
      }
    };

    var clivisState = {
      neume: function() {
        return new Neumes.Clivis();
      },
      handle: function(currNote, prevNote) {

        if (currNote.shape == NoteShape.Default && currNote.staffPosition > prevNote.staffPosition)
          return porrectusState;
        else
          return createNeume(new Neumes.Clivis(), false);
      }
    };

    var climacusState = {
      neume: function() {
        return new Neumes.Climacus();
      },
      handle: function(currNote, prevNote) {
        if (currNote.shape != NoteShape.Inclinatum)
          return createNeume(this.neume(), false);
        else
          return state;
      }
    };

    var porrectusState = {
      neume: function() {
        return new Neumes.Porrectus();
      },
      handle: function(currNote, prevNote) {

        if (currNote.shape == NoteShape.Default && currNote.staffPosition < prevNote.staffPosition)
          return createNeume(new Neumes.PorrectusFlexus(), true);
        else
          return createNeume(new Neumes.Porrectus(), false);
      }
    };

    var pesSubpunctisState = {
      neume: function() {
        return new Neumes.PesSubpunctis();
      },
      handle: function(currNote, prevNote) {
    
        if (currNote.shape != NoteShape.Inclinatum)
          return createNeume(new Neumes.PesSubpunctis(), false);
        else
          return state;
      }
    };

    var scandicusState = {
      neume: function() {
        return new Neumes.Scandicus();
      },
      handle: function(currNote, prevNote) {

        if (currNote.shape == NoteShape.Default && currNote.staffPosition < prevNote.staffPosition)
          return scandicusFlexusState;
        else
          return createNeume(new Neumes.Scandicus(), false);
      }
    };

    var scandicusFlexusState = {
      neume: function() {
        return new Neumes.ScandicusFlexus();
      },
      handle: function(currNote, prevNote) {
        return createNeume(new Neumes.ScandicusFlexus(), false);
      }
    };

    var virgaState = {
      neume: function() {
        return new Neumes.Virga();
      },
      handle: function(currNote, prevNote) {
    
        if (currNote.shape == NoteShape.Inclinatum && currNote.staffPosition < prevNote.staffPosition)
          return climacusState;
        else if (currNote.shape == NoteShape.Virga && currNote.staffPosition == prevNote.staffPosition)
          return bivirgaState;
        else
          return createNeume(new Neumes.Virga(), false);
      }
    };

    var bivirgaState = {
      neume: function() {
        return new Neumes.Bivirga();
      },
      handle: function(currNote, prevNote) {
    
        if (currNote.shape == NoteShape.Virga && currNote.staffPosition == prevNote.staffPosition)
          return createNeume(new Neumes.Trivirga(), false);
        else
          return createNeume(new Neumes.Bivirga(), false);
      }
    };

    var apostrophaState = {
      neume: function() {
        return new Neumes.Apostropha();
      },
      handle: function(currNote, prevNote) {
        if (currNote.staffPosition == prevNote.staffPosition && currNote.shape == NoteShape.Apostropha)
          return distrophaState;
        else
          return createNeume(new Neumes.Apostropha(), false);
      }
    };

    var distrophaState = {
      neume: function() {
        return new Neumes.Distropha();
      },
      handle: function(currNote, prevNote) {
        if (currNote.staffPosition == prevNote.staffPosition && currNote.shape == NoteShape.Apostropha)
          return createNeume(new Neumes.Tristropha(), true);
        else
          return createNeume(new Neumes.Distropha(), false);
      }
    };

    var torculusState = {
      neume: function() {
        return new Neumes.Torculus();
      },
      handle: function(currNote, prevNote) {
        if (currNote.shape == NoteShape.Default && currNote.staffPosition > prevNote.staffPosition)
          return torculusResupinusState;
        else
          return createNeume(new Neumes.Torculus(), false);
      }
    };

    var torculusResupinusState = {
      neume: function() {
        return new Neumes.TorculusResupinus();
      },
      handle: function(currNote, prevNote) {
        if (currNote.shape == NoteShape.Default && currNote.staffPosition < prevNote.staffPosition)
          return createNeume(new Neumes.TorculusResupinusFlexus(), true);
        else
          return createNeume(new Neumes.TorculusResupinus(), false);
      }
    };

    var state = unknownState;

    while (currNoteIndex < notes.length) {

      prevNote = currNote;
      currNote = notes[currNoteIndex];

      state = state.handle(currNote, prevNote);

      // if we are on the last note, then try to create a neume if we need to.
      if (currNoteIndex == notes.length - 1 && state != unknownState)
        createNeume(state.neume(), true);

      currNoteIndex++;
    }

    if (neumes.length > 0) {
      if (finalTrailingSpace >= 0) {
        neumes[neumes.length - 1].keepWithNext = true;
        neumes[neumes.length - 1].trailingSpace = finalTrailingSpace;
      }
    }

    return neumes;
  },

  createNoteFromData: function (clef, data) {

    var note = new Note();

    if (data.length < 1)
      throw 'Invalid note data: ' + data;

    if (data[0] == '-') { // liquescent
      note.isLiquescent = true;
      data = data.substring(1);
    }

    if (data.length < 1)
      throw 'Invalid note data: ' + data;

    // the next char is always the pitch
    var pitch = this.convertGabcStaffPositionToScribamPitch(clef, data[0]);

    if (data[0] == data[0].toUpperCase())
      note.shape = NoteShape.Inclinatum;

    note.staffPosition = this.convertGabcStaffPositionToScribamStaffPosition(clef, data[0]);
    note.pitch = pitch;

    // process the modifiers
    for (var i = 1; i < data.length; i++) {

      var c = data[i];
      var lookahead = '\0';

      var haveLookahead = i + 1 < data.length;
      if (haveLookahead)
        lookahead = data[i + 1];

      switch (c) {

        // rhythmic markings
        case '.':
          note.markings.push(new Markings.Mora(note));
          break;

        case '_':
          var mark = new Markings.HorizontalEpisema(note);
          if (haveLookahead && lookahead == '0') {
            mark.positionHint = MarkingPositionHint.Below;
            i++;
          }
          note.markings.push(mark);
          break;

        case '\'':
          note.markings.push(new Markings.Ictus(note));
          break;

          //note shapes
        case 'r':
          if (haveLookahead && lookahead == '1') {
            note.markings.push(new Markings.AcuteAccent(note));
            i++;
          } else
            note.shape = NoteShape.Cavum;
          break;

        case 'v':
          note.shape = NoteShape.Virga;
          break;

        case 'w':
          note.shape = NoteShape.Quilisma;
          break;

        case 'o':
          if (haveLookahead && lookahead == '<') {
            note.shape = NoteShape.OriscusAscending;
            i++;
          } else if (haveLookahead && lookahead == '>') {
            note.shape = NoteShape.OriscusDescending;
            i++;
          } else
            note.shape = NoteShape.OriscusAscending;
          break;

        // liquescents
        case '~':
          note.isLiquescent = true;
          break;
        case '<':
          note.isLiquescent = true;
          note.shape = NoteShape.AscLiquescent;
          break;
        case '>':
          note.isLiquescent = true;
          note.shape = NoteShape.DesLiquescent;
          break;

        // accidentals
        case 'x':
          if (note.pitch.step == Step.Mi)
            note.pitch.step = Step.Me;
          else if (note.pitch.step == Step.Ti)
            note.pitch.step = Step.Te;
          break;
        case 'y':
          if (note.pitch.step == Step.Te)
            note.pitch.step = Step.Ti;
          else if (note.pitch.step == Step.Me)
            note.pitch.step = Step.Mi;
          else if (note.pitch.step == Step.Du)
            note.pitch.step = Step.Do;
          else if (note.pitch.step == Step.Fu)
            note.pitch.step = Step.Fa;
          break;
        case '#':
          if (note.pitch.step == Step.Do)
            note.pitch.step = Step.Du;
          else if (note.pitch.step == Step.Fa)
            note.pitch.step = Step.Fu;
          break;
      }
    }

    return note;
  },

  // returns pitch
  convertGabcStaffPositionToScribamStaffPosition: function (clef, gabcStaffPos) {
    return gabcStaffPos.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) - 6;
  },

  // returns pitch
  convertGabcStaffPositionToScribamPitch: function (clef, gabcStaffPos) {
    var scribamStaffPosition = this.convertGabcStaffPositionToScribamStaffPosition(clef, gabcStaffPos)

    var pitch = clef.staffPositionToPitch(scribamStaffPosition);

    if (clef.activeAccidental != null)
      clef.activeAccidental.applyToPitch(pitch);

    return pitch;
  },
};

//export default Gabc;