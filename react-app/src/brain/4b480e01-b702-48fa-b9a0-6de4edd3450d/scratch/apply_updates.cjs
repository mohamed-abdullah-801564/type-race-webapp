const fs = require('fs');

const typingUtilsPath = 'd:/typing-site/react-app/src/utils/typingUtils.js';
const fixedTextsPath = 'd:/typing-site/react-app/src/brain/4b480e01-b702-48fa-b9a0-6de4edd3450d/scratch/fixed_texts.json';

// Read the new texts
let textsContent = fs.readFileSync(fixedTextsPath, 'utf16le');
if (textsContent.charCodeAt(0) === 0xFEFF) { textsContent = textsContent.slice(1); }
const fixedTexts = JSON.parse(textsContent);

// Current module metadata (to preserve titles, keys, etc.)
const modulesMetadata = [
    { id: 'mod_1', title: 'Home Row Basics', description: 'Establish the core foundation. Your fingers rest here for a reason.', keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'], difficulty: 'easy', minWPM: 15 },
    { id: 'mod_2', title: 'Home Row Mastery', description: 'Conquer the center column. Stretch your index fingers to reach the inner keys.', keys: ['G', 'H'], difficulty: 'easy', minWPM: 15 },
    { id: 'mod_3', title: 'Top Row Introduction', description: 'The upper deck. Focus on upward precision without moving your wrists.', keys: ['Q', 'W', 'E', 'R', 'Y', 'U', 'I', 'O', 'P'], difficulty: 'medium', minWPM: 25 },
    { id: 'mod_4', title: 'Top Row Mastery', description: 'Focus on the "T" reach. One of the most common characters in the lexicon.', keys: ['T'], difficulty: 'medium', minWPM: 25 },
    { id: 'mod_5', title: 'Bottom Row Basics', description: 'Descent into the lower grid. Master the downward stretch.', keys: ['Z', 'X', 'C', 'V', 'M', ',', '.', '/'], difficulty: 'medium', minWPM: 25 },
    { id: 'mod_6', title: 'Bottom Row Mastery', description: 'The index finger descent. Precision timing for "B" and "N".', keys: ['B', 'N'], difficulty: 'medium', minWPM: 25 },
    { id: 'mod_7', title: 'Shift & Capitalization', description: 'Neural synchronization for upper-case characters. Master the dual-hand shift.', keys: ['SHIFT'], difficulty: 'medium', minWPM: 25 },
    { id: 'mod_8', title: 'Numbers & Math', description: 'Numerical data entry. Quantize your input with the top row numbers.', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', '='], difficulty: 'hard', minWPM: 35 },
    { id: 'mod_9', title: 'Developer Syntax', description: 'The developer protocol. Master the structural symbols of the grid.', keys: ['{', '}', '[', ']', '(', ')', ';', '<', '>', '/'], difficulty: 'hard', minWPM: 35 },
    { id: 'mod_10', title: 'The Final Exam', description: 'The ultimate synthesis. Aggregate all protocols for maximum throughput.', keys: ['ALL'], difficulty: 'hard', minWPM: 35 }
];

const updatedModules = modulesMetadata.map(m => ({
    ...m,
    minAccuracy: 90,
    maxErrors: 15,
    texts: fixedTexts[m.id]
}));

// Read original typingUtils.js
let content = fs.readFileSync(typingUtilsPath, 'utf8');

// Find the ACADEMY_MODULES array and replace it
const startTag = 'export const ACADEMY_MODULES = [';
const endTag = '];';
const startIndex = content.indexOf(startTag);
if (startIndex === -1) {
    console.error('Could not find ACADEMY_MODULES start');
    process.exit(1);
}

// Find the matching closing bracket for the array
// Since the file has other arrays, we need to be careful.
// But ACADEMY_MODULES is followed by getModuleText or similar.
// Let's find the first ]; after the startIndex.
let endIndex = content.indexOf(endTag, startIndex);
if (endIndex === -1) {
    console.error('Could not find ACADEMY_MODULES end');
    process.exit(1);
}
endIndex += endTag.length;

const newArrayContent = `export const ACADEMY_MODULES = ${JSON.stringify(updatedModules, null, 4)};`;

const newFileContent = content.substring(0, startIndex) + newArrayContent + content.substring(endIndex);

fs.writeFileSync(typingUtilsPath, newFileContent);
console.log('Successfully updated ACADEMY_MODULES in typingUtils.js');
