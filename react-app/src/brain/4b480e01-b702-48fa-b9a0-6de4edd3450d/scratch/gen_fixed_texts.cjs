const fs = require('fs');

const MODULE_CONSTRAINTS = [
    { id: 'mod_1', chars: "asdfjkl; ", keys: "a s d f j k l ;" },
    { id: 'mod_2', chars: "asdfjkl;gh ", keys: "g h" },
    { id: 'mod_3', chars: "asdfjkl;ghqweryuiop ", keys: "q w e r y u i o p" },
    { id: 'mod_4', chars: "asdfjkl;ghqweryuiop t ", keys: "t" },
    { id: 'mod_5', chars: "asdfjkl;ghqweryuiop t zxcvm,./ ", keys: "z x c v m , . /" },
    { id: 'mod_6', chars: "asdfjkl;ghqweryuiop t zxcvm,./ bn ", keys: "b n" },
    { id: 'mod_7', chars: "asdfjkl;ghqweryuiop t zxcvm,./ bn SHIFT", keys: "SHIFT" },
    { id: 'mod_8', chars: "asdfjkl;ghqweryuiop t zxcvm,./ bn 1234567890-+= SHIFT", keys: "1 2 3 4 5 6 7 8 9 0 - + =" },
    { id: 'mod_9', chars: "asdfjkl;ghqweryuiop t zxcvm,./ bn 1234567890-+= {}[]();<>/ SHIFT", keys: "{ } [ ] ( ) ; < > /" },
    { id: 'mod_10', chars: "ALL", keys: "ALL" }
];

const POOLS = {
    mod_1: ["as", "ask", "alas", "alfalfa", "add", "ads", "fad", "fads", "dad", "dads", "lad", "lads", "sad", "fall", "falls", "flask", "flasks", "salad", "salads", "all"],
    mod_2: ["had", "has", "hag", "hags", "haggah", "hash", "hall", "halls", "flash", "flags", "glad", "glass", "gag", "gash", "dash", "gall", "gas", "slag", "shall", "slak"],
    mod_3: ["road", "rope", "read", "ride", "wire", "water", "paper", "power", "prior", "prey", "play", "plus", "pool", "pure", "poor", "pour", "pipe", "properly", "query", "queue", "quick", "quite", "row", "rule", "user", "upper", "outer", "your"],
    mod_4: ["the", "that", "this", "they", "their", "there", "those", "these", "to", "at", "it", "into", "through", "thought", "taught", "truth", "tough", "treat", "total", "text", "trust", "track", "title"],
    mod_5: ["move", "more", "make", "made", "map", "macro", "come", "came", "cave", "care", "case", "vocal", "view", "voice", "valve", "vault", "very", "volume", "vivid", "vanish", "vacuum", "zone", "zero", "zebra", "xenon", "basic", "carbon"],
    mod_6: ["bank", "back", "born", "burn", "bone", "book", "body", "blue", "busy", "best", "begin", "begun", "below", "bench", "between", "block", "build", "button", "bright", "broken", "branch"],
    mod_7: ["Admin", "System", "Data", "Network", "Grid", "Matrix", "Source", "Logic", "Active", "Secure", "Neural", "Identity", "Project", "Vault", "Mastery", "Rookie", "Advanced", "Expert", "Elite", "Legend", "Ghost", "Cyber", "Mainframe"],
    mod_8: ["100", "500", "1000", "2024", "price=10.99", "level-1", "level-2", "ratio=1.5", "50/50", "x+y=z", "a-b=c", "id=1", "id=2", "count:5", "8080", "3000", "Protocol", "3.14", "math", "sum", "Archive"],
    mod_9: ["if(x)", "else{", "while()", "[index]", "const", "let", "var", "function", "return", "await", "async", "import", "export", "class", "extends", "true", "false", "null", "undefined", "db.ref", "auth.user", "config.json", "npm/install", "<tag>", "/*block*/", "//comment", "error!", "success?", "yield*", "api/path"],
    mod_10: ["{id:1}", "user.uid", "Array[0]", "ctx.send", "Math.random()", "setTimeout()", "Promise.resolve()", "async/await", "header.sticky", "footer.links", "nav-item", "flex-col", "grid-cols-3", "border-primary/50"]
};

function generateText(moduleIdx) {
    const constraint = MODULE_CONSTRAINTS[moduleIdx];
    const isShiftEnabled = constraint.chars.includes("SHIFT") || constraint.chars === "ALL";
    
    // Combine pools up to current module
    let availablePool = [];
    for (let i = 0; i <= moduleIdx; i++) {
        const pool = POOLS[MODULE_CONSTRAINTS[i].id];
        // Weight current module's words more heavily
        const weight = (i === moduleIdx) ? 10 : 1;
        for (let w = 0; w < weight; w++) {
            availablePool = availablePool.concat(pool);
        }
    }

    const paragraphs = [];
    for (let p = 0; p < 5; p++) {
        let words = [];
        while (words.length < 90) {
            let word = availablePool[Math.floor(Math.random() * availablePool.length)];
            
            // Randomly capitalize if Shift is enabled and word is not already special
            if (isShiftEnabled && Math.random() > 0.8 && !/[A-Z!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(word)) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }
            
            words.push(word);
        }
        paragraphs.push(words.join(" "));
    }
    return paragraphs;
}

const finalModules = {};
MODULE_CONSTRAINTS.forEach((m, idx) => {
    finalModules[m.id] = generateText(idx);
});

fs.writeFileSync('d:/typing-site/react-app/src/brain/4b480e01-b702-48fa-b9a0-6de4edd3450d/scratch/fixed_texts.json', JSON.stringify(finalModules, null, 2), 'utf16le');
console.log('Generated fixed_texts.json with weighted pools');
