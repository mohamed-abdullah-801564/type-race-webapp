const { ACADEMY_MODULES } = require('./typingUtils.js');

const characterRules = {
    mod_1: "asdfjkl; ",
    mod_2: "asdfjkl; gh",
    mod_3: "asdfjkl;gh qweryuiop",
    mod_4: "asdfjkl;ghqweryuiop t",
    mod_5: "asdfjkl;ghqweryuiopt zxcvm,./",
    mod_6: "asdfjkl;ghqweryuioptzxcvm,./ bn",
};

// For mod_7+, we add specific logic
// mod_7: adds A-Z
// mod_8: adds 1234567890-+=
// mod_9: adds {}[]();<>/
// mod_10: ALL

function getCumulativeChars(modId) {
    let chars = "";
    if (modId === 'mod_1') return characterRules.mod_1;
    if (modId === 'mod_2') return characterRules.mod_2;
    if (modId === 'mod_3') return characterRules.mod_3;
    if (modId === 'mod_4') return characterRules.mod_4;
    if (modId === 'mod_5') return characterRules.mod_5;
    if (modId === 'mod_6') return characterRules.mod_6;
    
    let base = characterRules.mod_6;
    if (modId === 'mod_7') return base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (modId === 'mod_8') return base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+=";
    if (modId === 'mod_9') return base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+= {}[]();<>/";
    if (modId === 'mod_10') return null; // ALL
    return base;
}

ACADEMY_MODULES.forEach(mod => {
    const allowed = getCumulativeChars(mod.id);
    if (!allowed) {
        console.log(`[${mod.id}] All characters allowed.`);
        return;
    }
    
    const allowedSet = new Set(allowed.toLowerCase() + allowed.toUpperCase());
    
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
