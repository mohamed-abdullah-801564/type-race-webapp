const modules = [
    { id: 'mod_1', chars: 'asdfjkl; ' },
    { id: 'mod_2', chars: 'asdfjkl;gh ' },
    { id: 'mod_3', chars: 'asdfjkl;ghqweryuiop ' },
    { id: 'mod_4', chars: 'asdfjkl;ghqweryuiopt ' },
    { id: 'mod_5', chars: 'asdfjkl;ghqweryuioptzxcvm,./ ' },
    { id: 'mod_6', chars: 'asdfjkl;ghqweryuioptzxcvm,./bn ' },
    { id: 'mod_7', chars: 'asdfjkl;ghqweryuioptzxcvm,./bnABCDEFGHIJKLMNOPQRSTUVWXYZ ' },
    { id: 'mod_8', chars: 'asdfjkl;ghqweryuioptzxcvm,./bnABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+= ' },
    { id: 'mod_9', chars: 'asdfjkl;ghqweryuioptzxcvm,./bnABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+=!@#$%^&*()_[]{}|\\:;\'"<>,.?/ ' },
    { id: 'mod_10', chars: null } // All
];

function checkText(text, allowedChars) {
    if (!allowedChars) return true;
    for (const char of text) {
        if (!allowedChars.includes(char)) return false;
    }
    return true;
}

function wordCount(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

// Helper to generate some words for Mod 1
const mod1Words = ["as", "all", "ask", "alas", "aka", "ad", "dad", "dads", "lad", "lads", "alfalfa", "fad", "fads", "fall", "falls", "flask", "flasks", "salad", "salads", "sass", "sassafras", "sad", "ada", "flak", "flaks", "slash", "skulls"];
// wait, skulls has 'u'.
// Correct Mod 1: as all ask alas aka ad dad dads lad lads alfalfa fad fads fall falls flask flasks salad salads sass sassafras sad ada flak flaks slash. 

function generateParagraph(words, targetCount) {
    let p = "";
    while (wordCount(p) < targetCount) {
        p += words[Math.floor(Math.random() * words.length)] + " ";
    }
    return p.trim();
}

console.log("Check mod 1 words:", mod1Words.every(w => checkText(w, 'asdfjkl;')));
