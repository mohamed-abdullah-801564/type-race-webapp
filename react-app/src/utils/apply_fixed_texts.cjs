const fs = require('fs');

const newModules = JSON.parse(fs.readFileSync('fixed_texts.json', 'utf8'));
const typingUtilsPath = 'typingUtils.js';
let content = fs.readFileSync(typingUtilsPath, 'utf8');

const anchor = 'export const ACADEMY_MODULES = [';
const startIndex = content.indexOf(anchor);
const endIndex = content.indexOf('];', startIndex) + 2;

const newSection = `export const ACADEMY_MODULES = ${JSON.stringify(newModules, null, 4)};`;

const updatedContent = content.substring(0, startIndex) + newSection + content.substring(endIndex);

fs.writeFileSync(typingUtilsPath, updatedContent);
console.log("Updated typingUtils.js with new strict modules.");
