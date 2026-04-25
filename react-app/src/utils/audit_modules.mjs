import { ACADEMY_MODULES } from './typingUtils.js';

const characterRules = {
    mod_1: "asdfjkl; ",
    mod_2: "asdfjkl; gh",
    mod_3: "asdfjkl;gh qweryuiop",
    mod_4: "asdfjkl;ghqweryuiop t",
    mod_5: "asdfjkl;ghqweryuiopt zxcvm,./",
    mod_6: "asdfjkl;ghqweryuioptzxcvm,./ bn",
};

function getCumulativeChars(modId) {
    let base = characterRules.mod_6 || "";
    if (modId === 'mod_1') return characterRules.mod_1;
    if (modId === 'mod_2') return characterRules.mod_2;
    if (modId === 'mod_3') return characterRules.mod_3;
    if (modId === 'mod_4') return characterRules.mod_4;
    if (modId === 'mod_5') return characterRules.mod_5;
    if (modId === 'mod_6') return characterRules.mod_6;
    
    if (modId === 'mod_7') return base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (modId === 'mod_8') return base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+=";
    if (modId === 'mod_9') return base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+= {}[]();<>/";
    if (modId === 'mod_10') return null; // ALL
    return base;
}

ACADEMY_MODULES.forEach(mod => {
    const allowed = getCumulativeChars(mod.id);
    if (mod.id === 'mod_10') {
         console.log(`[${mod.id}] All characters allowed.`);
         return;
    }
    
    const allowedSet = new Set();
    if (allowed) {
        for (let char of allowed) {
            allowedSet.add(char.toLowerCase());
            allowedSet.add(char.toUpperCase());
        }
    }
    
    mod.texts.forEach((text, i) => {
        const violations = [];
        for (let char of text) {
            if (!allowedSet.has(char)) {
                violations.push(char);
            }
        }
        
        if (violations.length > 0) {
            const uniqueViolations = [...new Set(violations)];
            console.log(`[${mod.id}] Text ${i+1} FAIL: Illegal characters found: "${uniqueViolations.join('')}"`);
        } else {
            const wordCount = text.split(' ').length;
            console.log(`[${mod.id}] Text ${i+1} PASS. Word count: ${wordCount}`);
        }
    });
});
