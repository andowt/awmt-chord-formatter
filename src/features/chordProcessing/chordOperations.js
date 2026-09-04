const chordSharps = ['A#', 'C#', 'D#', 'F#', 'G#'];
const chordFlats = ['Bb', 'Db', 'Eb', 'Gb', 'Ab'];
const chordNaturals = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const transposeSharp = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
const transposeFlat =  ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];
const transposeMixed = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#'];

const naturalNotePattern = '\\b[A-Ga-g]';
const accidentals = '(b|#)?';  // Ensure 'bb' is checked before 'b'

let types = ['major', 'minor', 'majmin', 'minmaj', 'maj', 'min', 'aug', 'dim', 'sus'];

// Accommodate for first letter capital ie maj -> Maj
const typesCapitalize = types.map(item => item.charAt(0).toUpperCase() + item.slice(1));
types = types.concat(typesCapitalize);
// Accommodate for all letter caps ie maj -> MAJ
const typesUpper = types.map(item => item.toUpperCase());
types = types.concat(typesUpper);
// Accommodate for short hand ie Am7 or BM7
types = types.concat(['m', 'M']);
types = '(' + types.join('|') + ')?';

const dominant = '\\d*';
const extensions = '((b\\d{1,2})|(#\\d{1,2}))*';

const adds = '(add\\d{1,2}|Add\\d{1,2}|ADD\\d{1,2})?';

const formattedChordOptions = naturalNotePattern + adds + accidentals + adds + types + adds + dominant + adds + extensions + adds;
const formattedFullChords = formattedChordOptions + '(\\/(' + formattedChordOptions + '))?';
const formattedAllOptions = '(' + formattedFullChords + '(?=\\s|$)' + ')';

const chordRegex = new RegExp(formattedAllOptions, 'g');
console.log("formattedAllOptions: %s", formattedAllOptions);

let nonChordThreshold = 0.5;

export function normaliseChord(chord)
{
  if (/[a-g]/.test(chord.charAt(0))) // Convert to uppercase if lowercase chord detected
  {
    chord = chord.charAt(0).toUpperCase() + chord.slice(1)
  }
  return chord.replace(/^Cb/, 'B').replace(/^Fb/, 'E').replace(/^E#/, 'F').replace(/^B#/, 'C');
}

function checkChordDetectThreshold(text)
{
  const text_no_chords = text.replace(chordRegex, '').replace(/\s/g, ''); // Remove matches and then remove all whitespace
  const percent_non_chord = (text_no_chords.length / text.length);
  return (percent_non_chord < nonChordThreshold);
}

export function getChords(text) {
  let result = [];
  let matches = text.match(chordRegex);
  if((matches != null) && (matches.length > 0) && checkChordDetectThreshold(text))
  {
    result = matches;
  }
  return result;
}

export function getChordsWithIndex(text)
{
  let result = [[], []];
  let match;
  let matches = [];
  let indices = [];

  while ((match = chordRegex.exec(text)) !== null) {
    matches.push(match[0]);
    indices.push(match.index);
  }
  if ((matches.length > 0) && checkChordDetectThreshold(text))
  {
    result = [matches, indices]
  }

  return result;
}

export function getNormalisedChords(chords)
{
  let result = [];
  if(chords.length > 0)
  {
    let normalisedChords = chords.map(match => {
      // Check if the first character is lowercase
      if (/[a-g]/.test(match.charAt(0))) {
        return normaliseChord(match.charAt(0).toUpperCase() + match.slice(1)); // Capitalize the first letter
      } else {
        return normaliseChord(match); // Return unchanged if already capitalized or not a chord
      }
    });
    result = normalisedChords;
  }
  return result
}

export function markChords(text, leftStr, rightStr) {
  let result = text;
  const raw_chords = getChords(text);
  if(raw_chords.length > 0)
  {
  // Replace each match with the surrounded version
  result = text.replace(chordRegex, match => `${leftStr}${match}${rightStr}`);
  }
  return result;
}

export function transposeSingleChord(chord, steps) {

  chord = normaliseChord(chord); // Normalize the chord

  let match = null;
  let lookup_scale = transposeMixed; // Default lookup scale
  let output_scale = transposeMixed; // Default output scale

  if (chordSharps.some(sharpChord => chord.startsWith(sharpChord))) 
  {
    match = chordSharps.find(sharpChord => chord.startsWith(sharpChord));
    lookup_scale = transposeSharp;
  }
  else if (chordFlats.some(flatChord => chord.startsWith(flatChord))) 
  {
    match = chordFlats.find(flatChord => chord.startsWith(flatChord));
    lookup_scale = transposeFlat;
  } 
  else 
  {
    match = chordNaturals.find(naturalChord => chord.startsWith(naturalChord));
    lookup_scale = transposeMixed;
  }

  const currentIndex = lookup_scale.indexOf(match);
  if (currentIndex === -1) return chord;

  const newIndex = (currentIndex + steps + output_scale.length) % output_scale.length;

  return chord.replace(match, output_scale[newIndex]);
}

export function transposeChords(text, steps) {
  const raw_chords = getChords(text);

  if (raw_chords.length == 0) { return text; }

  let output_parts = []
  let remainder = text;
  for (const chord of raw_chords)
  {
      let newChord = chord;
      const chord_index = remainder.indexOf(chord)
      const firstPart = remainder.substring(0, chord_index + chord.length);
      remainder = remainder.substring(chord_index + chord.length);
      if (chord.includes('/'))
      {
        const splitChord = chord.split('/')
        const newUpper = transposeSingleChord(splitChord[0], steps);
        const newLower = transposeSingleChord(splitChord[1], steps);
        newChord = [newUpper, newLower].join('/');
      }
      else
      {
        newChord = transposeSingleChord(chord, steps);
      }
      output_parts.push(firstPart.replace(chord, newChord));
  }

  if (output_parts.length != raw_chords.length){ return text; }

  return output_parts.join('');

}




