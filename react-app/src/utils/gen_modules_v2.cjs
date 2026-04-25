const fs = require('fs');

const characterSets = {
  mod_1: "asdfjkl; ".split(''),
  mod_2: "asdfjkl;gh ".split(''),
  mod_3: "asdfjkl;ghqweryuiop ".split(''),
  mod_4: "asdfjkl;ghqweryuiopt ".split(''),
  mod_5: "asdfjkl;ghqweryuioptzxcvm,./ ".split(''),
  mod_6: "asdfjkl;ghqweryuioptzxcvm,./bn ".split(''),
  mod_7: "asdfjkl;ghqweryuioptzxcvm,./bnABCDEFGHIJKLMNOPQRSTUVWXYZ ".split(''),
  mod_8: "asdfjkl;ghqweryuioptzxcvm,./bnABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+= ".split(''),
  mod_9: "asdfjkl;ghqweryuioptzxcvm,./bnABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+= {}[]();<>\\/ ".split(''),
};

const wordsBySet = {
  mod_1: ["as", "add", "ads", "ask", "alas", "dad", "dads", "fall", "falls", "flask", "glass", "glad", "lad", "lads", "lass", "salad", "salsa", "sass", "fad", "fads", "alfalfa", "all"],
  mod_2: ["had", "has", "hag", "ash", "dash", "gash", "flash", "slash", "hall", "shall", "flag", "flags", "haggah", "gall", "sad", "gag"],
  mod_3: ["power", "wire", "upper", "quite", "row", "query", "queue", "pure", "rope", "road", "read", "prior", "pool", "pipe", "pour", "paper", "properly", "user", "order", "plus", "rule"],
  mod_4: ["that", "this", "they", "there", "their", "those", "these", "through", "thought", "title", "total", "taught", "trust", "treat", "track", "truth", "into", "tough", "at"],
  mod_5: ["zone", "xenon", "vivid", "valve", "vacuum", "vanish", "zebra", "move", "made", "make", "map", "macro", "came", "care", "case", "vocal", "volume", "more", "very", "basic", "carbon", "cave"],
  mod_6: ["bank", "branch", "bright", "broken", "back", "blue", "best", "book", "begin", "body", "born", "burn", "between", "below", "bench", "build", "busy", "box", "born", "begun", "block"],
  mod_7: ["Project", "Archive", "Ghost", "Vault", "System", "Neural", "Network", "Matrix", "Protocol", "Identity", "Admin", "User", "Data", "Source", "Logic", "Mainframe", "Cyber", "Secure", "Active", "Elite", "Advanced", "Legend", "Expert", "Rookie", "Grid", "Zero", "Mastery", "Glass"],
  mod_8: ["100", "500", "1000", "3000", "2024", "8080", "50/50", "ratio=1.5", "price=10.99", "id=1", "id=2", "count:5", "x+y=z", "a-b=c", "Sum", "Math", "Protocol", "Archive"],
  mod_9: ["if(x)", "else{", "while()", "function", "const", "let", "var", "return", "await", "async", "import", "export", "class", "extends", "true", "false", "null", "undefined", "db.ref", "auth.user", "npm/install", "api/path", "config.json", "[index]", "<tag>", "//comment", "/*block*/", "yield*"],
  mod_10: ["setTimeout()", "Promise.resolve()", "grid-cols-3", "nav-item", "header.sticky", "footer.links", "border-primary/50", "Math.random()", "user.uid", "ctx.send", "Array[0]", "flex-col", "{id:1}"]
};

function checkWord(word, allowedChars) {
    const set = new Set(allowedChars.map(c => c.toLowerCase()));
    for (let char of word) {
        if (char === ' ') continue;
        if (!set.has(char.toLowerCase())) return false;
    }
    return true;
}

function generateModuleText(modId, allowedChars, pool) {
    const texts = [];
    const filteredPool = pool.filter(w => checkWord(w, allowedChars));
    
    for (let i = 0; i < 5; i++) {
        let text = "";
        let wordCount = 0;
        while (wordCount < 90) {
            const word = filteredPool[Math.floor(Math.random() * filteredPool.length)];
            text += word + " ";
            wordCount++;
        }
        texts.push(text.trim());
    }
    return texts;
}

const modules = [
    { id: 'mod_1', title: 'Home Row Basics', description: 'Establish the core foundation.', keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'], difficulty: 'easy', minWPM: 15, minAccuracy: 90, maxErrors: 15 },
    { id: 'mod_2', title: 'Home Row Mastery', description: 'Conquer the center column.', keys: ['G', 'H'], difficulty: 'easy', minWPM: 15, minAccuracy: 90, maxErrors: 15 },
    { id: 'mod_3', title: 'Top Row Introduction', description: 'The upper deck.', keys: ['Q', 'W', 'E', 'R', 'Y', 'U', 'I', 'O', 'P'], difficulty: 'medium', minWPM: 25, minAccuracy: 90, maxErrors: 15 },
    { id: 'mod_4', title: 'Top Row Mastery', description: 'Focus on the "T" reach.', keys: ['T'], difficulty: 'medium', minWPM: 25, minAccuracy: 90, maxErrors: 15 },
    { id: 'mod_5', title: 'Bottom Row Basics', description: 'Descent into the lower grid.', keys: ['Z', 'X', 'C', 'V', 'M', ',', '.', '/'], difficulty: 'medium', minWPM: 25, minAccuracy: 90, maxErrors: 15 },
    { id: 'mod_6', title: 'Bottom Row Mastery', description: 'The index finger descent.', keys: ['B', 'N'], difficulty: 'medium', minWPM: 25, minAccuracy: 90, maxErrors: 15 },
    { id: 'mod_7', title: 'Shift & Capitalization', description: 'Neural synchronization.', keys: ['SHIFT'], difficulty: 'medium', minWPM: 25, minAccuracy: 90, maxErrors: 15 },
    { id: 'mod_8', title: 'Numbers & Math', description: 'Numerical data entry.', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', '='], difficulty: 'hard', minWPM: 35, minAccuracy: 90, maxErrors: 15 },
    { id: 'mod_9', title: 'Developer Syntax', description: 'The developer protocol.', keys: ['{', '}', '[', ']', '(', ')', ';', '<', '>', '/'], difficulty: 'hard', minWPM: 35, minAccuracy: 90, maxErrors: 15 },
    { id: 'mod_10', title: 'The Final Exam', description: 'The ultimate synthesis.', keys: ['ALL'], difficulty: 'hard', minWPM: 35, minAccuracy: 90, maxErrors: 15 }
];

let cumulativeWordList = [];
const finalModules = modules.map(mod => {
    cumulativeWordList = [...new Set([...cumulativeWordList, ...(wordsBySet[mod.id] || [])])];
    const allowed = characterSets[mod.id] || "abcdefghijklmnopqrstuvwxyz1234567890-+= {}[]();<>/\"'@#$%^&*".split('');
    return {
        ...mod,
        texts: generateModuleText(mod.id, allowed, cumulativeWordList)
    };
});

fs.writeFileSync('fixed_texts.json', JSON.stringify(finalModules, null, 2));
console.log("Generated fixed_texts.json");
