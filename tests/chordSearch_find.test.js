import fs from 'fs';
import path from 'path';
import { getChords, getNormalisedChords } from '../src/features/chordProcessing/chordOperations.js';

import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const testCases = [
    { 
        input: 'A', 
        expected: {
            found: ['A'],
            normal: ['A']
        }
    },
    { 
        input: 'A#', 
        expected: {
            found: ['A#'],
            normal: ['A#']
        }
    },
    { 
        input: 'Cb', 
        expected: {
            found: ['Cb'],
            normal: ['B']
        }
    },
    { 
        input: 'e#', 
        expected: {
            found: ['e#'],
            normal: ['F']
        }
    },
    { 
        input: 'Bm', 
        expected: {
            found: ['Bm'],
            normal: ['Bm']
        }
    },
    { 
        input: 'AMaj', 
        expected: {
            found: ['AMaj'],
            normal: ['AMaj']
        }
    },
    { 
        input: 'BMinor', 
        expected: {
            found: ['BMinor'],
            normal: ['BMinor']
        }
    },
    { 
        input: 'CMajor', 
        expected: {
            found: ['CMajor'],
            normal: ['CMajor']
        }
    },
    { 
        input: 'Ab7', 
        expected: {
            found: ['Ab7'],
            normal: ['Ab7']
        }
    },
    { 
        input: 'Abb7', 
        expected: {
            found: ['Abb7'],
            normal: ['Abb7']
        }
    },
    { 
        input: 'Bm7', 
        expected: {
            found: ['Bm7'],
            normal: ['Bm7']
        }
    },
    { 
        input: 'A#7', 
        expected: {
            found: ['A#7'],
            normal: ['A#7']
        }
    },
    { 
        input: 'Am7/Bb', 
        expected: {
            found: ['Am7/Bb'],
            normal: ['Am7/Bb']
        }
    },
    { 
        input: 'Am7b5', 
        expected: {
            found: ['Am7b5'],
            normal: ['Am7b5']
        }
    },
    { 
        input: 'Fm7#11', 
        expected: {
            found: ['Fm7#11'],
            normal: ['Fm7#11']
        }
    },
    { 
        input: 'Cminmaj7', 
        expected: {
            found: ['Cminmaj7'],
            normal: ['Cminmaj7']
        }
    },
    { 
        input: 'AMaj7#9', 
        expected: {
            found: ['AMaj7#9'],
            normal: ['AMaj7#9']
        }
    },
    { 
        input: 'Eadd9', 
        expected: {
            found: ['Eadd9'],
            normal: ['Eadd9']
        }
    },
    { 
        input: 'AMaj7#9add13', 
        expected: {
            found: ['AMaj7#9add13'],
            normal: ['AMaj7#9add13']
        }
    },
    { 
        input: 'Eadd9#11', 
        expected: {
            found: ['Eadd9#11'],
            normal: ['Eadd9#11']
        }
    },
    { 
        input: 'Cheese', 
        expected: {
            found: [],
            normal: []
        }
    },
    { 
        input: 'I am the highway', 
        expected: {
            found: [],
            normal: [],
        }
    },
    { 
        input: 'I Am the highway', 
        expected: {
            found: [],
            normal: [],
        }
    },
    { 
        input: 'On the road again', 
        expected: {
            found: [],
            normal: []
        }
    },
    { 
        input: 'A man from kentucket', 
        expected: {
            found: [], // Match found - Unavoidable False positive
            normal: [], // Match found - Unavoidable False positive
        }
    },
    { 
        input: 'Robert E Lee', 
        expected: {
            found: [], // No chord found, should return null
            normal: [], // No chord found, should return null
        }
    },
    { 
        input: 'Am   BMaj7    DMinor  CbMajor  A#', 
        expected: {
            found: ["Am", "BMaj7", "DMinor", "CbMajor", "A#"],
            normal: ["Am", "BMaj7", "DMinor", "BMajor", "A#"]
        }
    },
    { 
        input: 'Cmin7b5#11b9#13b12#2', 
        expected: {
            found: ['Cmin7b5#11b9#13b12#2'],
            normal: ['Cmin7b5#11b9#13b12#2']
        }
    },
    { 
        input: 'Em     Em  Am  DMajor DMajor', 
        expected: {
            found: ["Em", "Em", "Am", "DMajor", "DMajor"],
            normal: ["Em", "Em", "Am", "DMajor", "DMajor"]
        }
    },
    { 
        input: 'e#7 a  d   em9', 
        expected: {
            found: ['e#7', 'a', 'd', 'em9'],
            normal: ['F7', 'A', 'D', 'Em9']
        }
    },
    {
        input: '[INTRO] Am D7  eb5',
        expected: {
            found: ['Am', 'D7', 'eb5'],
            normal: ['Am', 'D7', 'Eb5']
        }
    },
    {
        input: '[INTRO] Am D7  eb5 X3',
        expected: {
            found: ['Am', 'D7', 'eb5'],
            normal: ['Am', 'D7', 'Eb5']
        }
    }
];


describe('Chord Finder Line Tests', () => {
    let passCount = 0;
    const totTests = testCases.length;

    testCases.forEach(({ input, expected }, index) => {
        test(`Test ${index}: ${input}`, () => {
            const chords = getChords(input);
            const normal = getNormalisedChords(chords);
            expect(chords).toEqual(expected?.found); // Use expected.found for array comparison
            expect(normal).toEqual(expected?.normal);

            if (
                chords &&
                expected &&
                chords.length === expected.found.length &&
                chords.every((value, idx) => value === expected.found[idx]) &&
                normal &&
                expected.normal &&
                normal.length === expected.normal.length &&
                normal.every((value, idx) => value === expected.normal[idx])
            ) {
                passCount += 1;
            } else if (!chords && !expected.found && !normal && !expected.normal) {
                passCount += 1;
            }
        });
    });

    afterAll(() => {
        console.log(`Tests completed - ${passCount}/${totTests} passed`);
    });
});


describe('Chord Finder File Test', () => {
    const filePath = path.join(__dirname, 'chordSheetSample.txt');
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

        const expected = [
            ['E', 'G#7'],
            ['F#m'],
            ['A', 'B7', 'E'],
            ['E', 'G#7', 'F#m', 'A', 'B7', 'E'],
            ['E', 'G#7', 'F#m', 'A', 'B7', 'E'],
            ['A', 'E'],
            ['A', 'E', 'B7']
        ]

        // Process each line
        let i = 0;
        for (const line of lines) {
            const chords = getChords(line);
            if (chords.length == 0) continue;
            expect(chords).toEqual(expected[i++]);
        }

    });

    afterAll(() => {
        console.log(`Tests completed`);
    });
});
