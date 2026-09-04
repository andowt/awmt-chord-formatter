import { markChords, transposeChords, getChordsWithIndex, getChords } from './chordOperations.js';

let chordsMarked = false;
let chordsNested = false;

// Function to format content with chord highlighting
export function markChordsInContent(content)
{
  let result = content;
  if(!chordsMarked && !chordsNested)
  {
    chordsMarked = true;
    let outputText = [];
    const lines = content.split('\n');
    for (const line of lines) {
      outputText.push(markChords(line, '{', '}'));
    }
    result = outputText.join('\n');
  }
  return result;
}

export function unMarkChordsInContent(content)
{
  let result = content;
  if(chordsMarked && !chordsNested)
  {
    chordsMarked = false;
    result = content.replace(/\{/g, '').replace(/\}/g, '');
  }
  return result;
}

export function nestChordsInContent(content)
{
  let result = content;
  if(!chordsNested)
  {
    if(chordsMarked){content = unMarkChordsInContent(content);}
    chordsNested = true;
    let lines = content.split('\n');
    let result_lines = [];
    if((lines.length %2)!=0){lines.push("");}
    let n = 0;
    while(n < lines.length) {
      let [chords, indexes] = getChordsWithIndex(lines[n]);
      if((chords.length > 0) && ((n+1) < lines.length) && (getChords(lines[n+1]) == 0) && !lines[n+1].match(/^\s*$/))
      {
        let offset = 0;
        let newLine = lines[n+1]
        for(let i=0; i<chords.length; i++)
        {
          let new_pos = indexes[i] + offset;
          newLine = (newLine.slice(0, indexes[i] + offset) + '{' + chords[i] + '}' + newLine.slice(new_pos));
          offset += chords[i].length+2;
        }
        result_lines.push(newLine);
        n++;
      }
      else
      {
        result_lines.push(lines[n]);
      }
      n++;
    }
    result = result_lines.join('\n');
  }
  return result;
}


export function unNestChordsInContent(content) 
{
  let result = content;
  if(chordsNested)
  {
    chordsNested = false;
    let lines = content.split('\n');
    let result_lines = [];

    for (let n = 0; n < lines.length; n++) {
      let line = lines[n];
      let chords = [];
      let indices = [];
      let newLine = '';

      // Extract chords and their indices
      line.replace(/\{(.*?)\}/g, (match, p1, offset) => {
        chords.push(p1);
        indices.push(offset);
      });

      // Create a line with chords in their original positions
      if (chords.length > 0) {
        let offset = 0;
        let chordLine = '';
        for(let i=0; i<chords.length; i++)
        {
          indices[i] = indices[i] - offset;
          offset += chords[i].length + 2; //Bracket LR
        }
        let charCount=0;
        let chordCount=0;
        for(let i=0; i < indices.length; i++)
        {
          let charCountOnEntry = charCount;
          while(charCount < indices[i])
          {
            chordLine += ' ';
            charCount++;
          }
          if((indices[i] != 0) && ((charCount - charCountOnEntry) == 0))
          {
            chordLine += ' ';
            charCount++;
          }
          charCount += chords[chordCount].length;
          chordLine += chords[chordCount++];
        }
        result_lines.push(chordLine);
      }

      // Remove chord markers from the current line
      newLine = line.replace(/\{.*?\}/g, '');
      result_lines.push(newLine);
    }

    result = result_lines.join('\n');
  }
  return result;
}

export function transposeInContent(content, steps)
{
  let result = content;
  if(!chordsNested)
  {
    let reMark = false;
    if(chordsMarked){content = unMarkChordsInContent(content); reMark = true;}
    let outputText = [];
    const lines = content.split('\n');
    for (const line of lines) {
      outputText.push(transposeChords(line, steps));
    }
    result = outputText.join('\n');
    if(reMark){result = markChordsInContent(result);}
  }
  return result;
}

export function autoBreakContent(content, fontSize, a3) {
  // Lookup table of font sizes and their corresponding maximum line lengths
  const fontSizeLookup = [
    { size: 8,  maxLength: 112 },
    { size: 10, maxLength: 89 },
    { size: 12, maxLength: 70 },
    { size: 14, maxLength: 64 },
    { size: 16, maxLength: 56 },
    { size: 18, maxLength: 49 },
    { size: 20, maxLength: 44 },
    { size: 22, maxLength: 40 },
    { size: 24, maxLength: 37 },
    { size: 26, maxLength: 34 },
    { size: 28, maxLength: 32 },
    { size: 30, maxLength: 24 }
  ];

  // Find the maximum line length for the given font size
  let maxLength = 0;
  for (let i = 0; i < fontSizeLookup.length; i++) {
    if (fontSize === fontSizeLookup[i].size) {
      maxLength = fontSizeLookup[i].maxLength;
      break;
    }
  }
  
  // If no matching font size is found, return original content
  if (maxLength === 0) {
    return content;
  }

  // Adjust maxLength if printing on A3 paper
  if (a3) {
    maxLength *= 1.4;
  }

  // Function to nest chords in content (assuming it's defined elsewhere)
  content = nestChordsInContent(content);
  let resultLines = [];
  for(const line of content.split('\n')) {
    let cleanedLine = line.replace(/\u00A0/g, ' ');
    if(cleanedLine.length <= maxLength)
    {
      resultLines.push(cleanedLine);
    }
    else
    {
      let words = cleanedLine.split(' ');
      let currentLine = '';
      
      for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + ' ' + words[i];
        console.log("testLine");
        console.log(testLine);
        
        if (testLine.length <= maxLength) {
          currentLine = testLine;
        } else {
          console.log("HERE PUSHING");
          console.log(currentLine)
          resultLines.push(currentLine);
          currentLine = words[i];
        }
      }
      
      if (currentLine !== '') {
        resultLines.push(currentLine);
      }
    }
  }

  // Function to un-nest chords in content (assuming it's defined elsewhere)
  return unNestChordsInContent(resultLines.join('\n'));
}

export function removeBlankLinesInContent(content)
{
  let result = content;
  let prevMarked = false;
  if(!chordsNested)
  {
    if(chordsMarked){unMarkChordsInContent(content); prevMarked = true;}
    // Split the lyrics into lines
    let lines = content.split('\n');

    let result_lines = [];
    let n=0;
    while (n < lines.length) {
      let line_n_match = lines[n].match(/^\s*$/);
      if(line_n_match && ((n + 1) < lines.length) && lines[n+1].match(/^\s*$/))
      {
        result_lines.push("");
        n++;
      }
      else if(!line_n_match)
      {
        result_lines.push(lines[n]);
      }
      n++
    }
    // Join the lines into a single string with newlines and return the result
    result = result_lines.join('\n');
    if(prevMarked){markChordsInContent(result);}
  }
  return result;
}
