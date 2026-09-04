import fs from 'fs';
import path from 'path';
import { transposeChords } from '../src/features/chordProcessing/chordOperations.js';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testCases = [
    { input: 'A', steps: 0, expected: 'A' },
    { input: 'A', steps: 1, expected: 'Bb' },
    { input: 'F#', steps: 1, expected: 'G' },
    { input: 'A', steps: -1, expected: 'G#' },
    { input: 'C', steps: 2, expected: 'D' },
    { input: 'G', steps: -2, expected: 'F' },
    { input: 'D#', steps: 3, expected: 'F#' },
    { input: 'Eb', steps: -3, expected: 'C' },
    { input: 'F#', steps: 4, expected: 'Bb' },
    { input: 'Gb', steps: -4, expected: 'D' },
    { input: 'Bb', steps: 5, expected: 'Eb' },
    { input: 'Db', steps: -5, expected: 'G#' },
    { input: 'E', steps: 6, expected: 'Bb' },
    { input: 'F', steps: -6, expected: 'B' },
    { input: 'A#', steps: 7, expected: 'F' },
    { input: 'Cb', steps: 8, expected: 'G' },
    { input: 'Fb', steps: 9, expected: 'C#' },
    { input: 'E#', steps: 10, expected: 'Eb' },
    { input: 'B#', steps: 11, expected: 'B' },
    { input: 'G#', steps: 12, expected: 'G#' },
    { input: 'Ab', steps: -12, expected: 'G#' },
    { input: 'Am   BMaj7    DMinor  CbMajor  A#', steps: 0, expected: 'Am   BMaj7    DMinor  BMajor  Bb' },
    { input: 'Am   BMaj7    DMinor  CbMajor  A#', steps: 12, expected: 'Am   BMaj7    DMinor  BMajor  Bb' },
    { input: 'Am   BMaj7    DMinor  CbMajor  A#', steps: -12, expected: 'Am   BMaj7    DMinor  BMajor  Bb' },
    { input: 'Am   BMaj7    DMinor  CbMajor  A#', steps: 1, expected: 'Bbm   CMaj7    EbMinor  CMajor  B' },
    { input: 'Am   BMaj7    DMinor  CbMajor  A#', steps: -1, expected: 'G#m   BbMaj7    C#Minor  BbMajor  A' },
    { input: 'Am   BMaj7    DMinor  CbMajor  A#', steps: 2, expected: 'Bm   C#Maj7    EMinor  C#Major  C' },
    { input: 'Am   BMaj7    DMinor  CbMajor  A#', steps: -2, expected: 'Gm   AMaj7    CMinor  AMajor  G#' },
    { input: 'Cmaj7  Dm7  G7  E7  A', steps: 5, expected: 'Fmaj7  Gm7  C7  A7  D' },
    { input: 'Cmaj7  Dm7  G7  E7  A', steps: -3, expected: 'Amaj7  Bm7  E7  C#7  F#' },
    { input: 'Bb7  Ebm7  Ab7  Dbmaj7  Gbmaj7', steps: 1, expected: 'B7  Em7  A7  Dmaj7  Gmaj7' },
    { input: 'Bb7  Ebm7  Ab7  Dbmaj7  Gbmaj7', steps: -1, expected: 'A7  Dm7  G7  Cmaj7  Fmaj7' },
    { input: 'F#m7  B7  Emaj7  Amaj7  Dmaj7', steps: 4, expected: 'Bbm7  Eb7  G#maj7  C#maj7  F#maj7' },
    { input: 'F#m7  B7  Emaj7  Amaj7  Dmaj7', steps: -5, expected: 'C#m7  F#7  Bmaj7  Emaj7  Amaj7' },
    { input: 'G   C   D   Am   Em', steps: 7, expected: 'D   G   A   Em   Bm' },
    { input: 'G   C   D   Am   Em', steps: -7, expected: 'C   F   G   Dm   Am' },
    { input: 'Dbmaj7  Gb7  Bmaj7  Emaj7  A#m7', steps: 2, expected: 'Ebmaj7  G#7  C#maj7  F#maj7  Cm7' },
    { input: 'Dbmaj7  Gb7  Bmaj7  Emaj7  A#m7', steps: -2, expected: 'Bmaj7  E7  Amaj7  Dmaj7  G#m7' },
    { input: 'Ebm9  Ab13  Dbmaj9  Gbmaj9  C7b9', steps: 3, expected: 'F#m9  B13  Emaj9  Amaj9  Eb7b9' },
    { input: 'Ebm9  Ab13  Dbmaj9  Gbmaj9  C7b9', steps: -3, expected: 'Cm9  F13  Bbmaj9  Ebmaj9  A7b9' },
    { input: 'e#7 a  d   em9  cb13', steps: 0, expected: 'F7 A  D   Em9  B13'},
    { input: 'A/C#  D/F#  G/B  Em  Bm/F#', steps: 5, expected: 'D/F#  G/B  C/E  Am  Em/B' }, // Added more complex slash chords
    { input: 'A/C#  D/F#  G/B  Em  Bm/F#', steps: -3, expected: 'F#/Bb  B/Eb  E/G#  C#m  G#m/Eb' }, // Added more complex slash chords

];

describe('Chord Transposer Line Tests', () => {
    let passCount = 0;
    const totTests = testCases.length;

    testCases.forEach(({ input, steps, expected }, index) => {
        test(`Test ${index}: transpose(${steps}) - ${input}`, () => {
            const result = transposeChords(input, steps);
            expect(result).toEqual(expected); // Use toEqual for string comparison

            if (result === expected) {
                passCount += 1;
            }
        });
    });

    afterAll(() => {
        console.log(`Tests completed - ${passCount}/${totTests} passed`);
    });
});

describe('Chord Transposer Full Loop Up Tests', () => {
    let passCount = 0;
    const totTests = testCases.length;

    testCases.forEach(({ input, steps, _}, index) => {
        test(`Test ${index}: transpose(${steps}) - ${input}`, () => {
            const expected = transposeChords(input, 0)
            const result = transposeChords(input, 12);
            expect(result).toEqual(expected); // Use toEqual for string comparison

            if (result === expected) {
                passCount += 1;
            }
        });
    });

    afterAll(() => {
        console.log(`Tests completed - ${passCount}/${totTests} passed`);
    });
});

describe('Chord Transposer Full Loop Down Tests', () => {
    let passCount = 0;
    const totTests = testCases.length;

    testCases.forEach(({ input, steps, _}, index) => {
        test(`Test ${index}: transpose(${steps}) - ${input}`, () => {
            const expected = transposeChords(input, 0)
            const result = transposeChords(input, -12);
            expect(result).toEqual(expected); // Use toEqual for string comparison

            if (result === expected) {
                passCount += 1;
            }
        });
    });

    afterAll(() => {
        console.log(`Tests completed - ${passCount}/${totTests} passed`);
    });
});

describe('Chord Transposer Stepped Test', () =>{

    test(`Test 0`, () => {
        const example = "E G#7 F#m A B7 E"
        let modified_line = example
        for(let i=0; i<20; i++)
        {
            modified_line = transposeChords(modified_line, 1);
            let check_line = transposeChords(example, i+1);
            expect(modified_line).toEqual(check_line); // Use toEqual for string comparison
        }
    });

    afterAll(() => {
        console.log(`Tests completed`);
    });
})

describe('Chord Transposer File Test', () => {
    const filePath = path.join(__dirname, 'chordSheetFull.txt');
    test('Test 0: Chord Sheet Sample', () => {
        
        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            console.log("FILE NOT FOUND");
            fail(`File not found at "${filePath}"`);
        }

        // Read the entire file into memory
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Split the file content into an array of lines
        const lines = fileContent.split(/\r?\n/);
        let modifiedLines = lines.slice();

        // Transpose each line up by 1 semitone 12 times
        for (let i = 0; i < 12; i++) {
            for (let j = 0; j < modifiedLines.length; j++) {
                modifiedLines[j] = transposeChords(modifiedLines[j], 1);
            }
        }

        // Transpose each line down by 1 semitone 12 times
        for (let i = 0; i < 12; i++) {
            for (let j = 0; j < modifiedLines.length; j++) {
                modifiedLines[j] = transposeChords(modifiedLines[j], -1);
            }
        }

        // Verify that the modified lines match the original lines
        for (let i = 0; i < lines.length; i++) {
            expect(modifiedLines[i]).toEqual(lines[i]);
        }

    });

    afterAll(() => {
        console.log(`Tests completed`);
    });
});