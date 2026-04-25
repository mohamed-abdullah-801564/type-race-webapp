const modules = [
    { id: 'mod_1', keys: 'asdfjkl; ', words: ["as", "all", "ask", "alas", "aka", "ad", "dad", "dads", "lad", "lads", "alfalfa", "fad", "fads", "fall", "falls", "flask", "flasks", "salad", "salads", "sass", "sassafras", "sad", "ada", "flak", "flaks", "slash", "kafka", "dada", "kala", "ajl", "slak"] },
    { id: 'mod_2', keys: 'asdfjkl;gh ', words: ["glass", "glad", "flag", "flags", "hag", "hags", "hash", "hall", "halls", "half", "slag", "flash", "gash", "dash", "gas", "gall", "gag", "has", "had", "shall", "haggah", "slash", "flash", "glad", "flag", "glass"] },
    { id: 'mod_3', keys: 'asdfjkl;ghqweryuiop ', words: ["power", "trip", "wire", "tree", "root", "water", "outer", "upper", "quite", "write", "petty", "properly", "query", "queue", "quality", "quick", "pure", "rope", "road", "read", "paper", "pipe", "pool", "poor", "pour", "prior", "prowl", "prey", "play", "plus"] },
    { id: 'mod_4', keys: 'asdfjkl;ghqweryuiopt ', words: ["that", "this", "then", "they", "there", "their", "them", "those", "these", "through", "thought", "things", "track", "trust", "true", "truth", "total", "taught", "thought", "tough", "treat", "title", "threat", "the", "to", "at", "it", "into"] },
    { id: 'mod_5', keys: 'asdfjkl;ghqweryuioptzxcvm,./ ', words: ["zone", "xenon", "cabin", "valve", "basic", "navy", "macro", "vacuum", "carbon", "convex", "vanish", "zebra", "move", "moved", "more", "make", "made", "map", "max", "come", "came", "care", "case", "cave", "view", "voice", "vocal", "volume", "very"] },
    { id: 'mod_6', keys: 'asdfjkl;ghqweryuioptzxcvm,./bn ', words: ["bank", "bend", "bone", "born", "burn", "basic", "bench", "block", "branch", "bright", "broken", "back", "black", "blue", "best", "book", "box", "build", "button", "begin", "begun", "below", "behind", "between", "busy", "body", "build", "built"] },
    { id: 'mod_7', keys: 'asdfjkl;ghqweryuioptzxcvm,./bnABCDEFGHIJKLMNOPQRSTUVWXYZ ', words: ["Project", "Archive", "Ghost", "Vault", "System", "Neural", "Network", "Matrix", "Protocol", "Identity", "Admin", "User", "Data", "Source", "Logic", "Mainframe", "Cyber", "Grid", "Mastery", "Elite", "Legend", "Expert", "Elite", "Advanced", "Rookie", "Secure", "Active"] },
    { id: 'mod_8', keys: 'asdfjkl;ghqweryuioptzxcvm,./bnABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+= ', words: ["100", "200", "404", "500", "8080", "3000", "123", "456", "789", "0", "10", "20", "50/50", "math", "total", "sum", "count", "value", "id=1", "id=2", "price=10.99", "ratio=1.5", "level-1", "level-2", "x+y=z", "a-b=c"] },
    { id: 'mod_9', keys: 'asdfjkl;ghqweryuioptzxcvm,./bnABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+=!@#$%^&*()_[]{}|\\:;\'"<>,.?/ ', words: ["(id)", "{data}", "[index]", "<tag>", "if(x)", "const", "await", "async", "import", "export", "class", "return", "true", "false", "this.state", "db.ref", "api/path", "//comment", "/*block*/", "error!", "success?", "config.json", "node.js"] },
    { id: 'mod_10', keys: null, words: ["comprehensive", "synthesis", "integration", "performance", "optimization", "infrastructure", "scalability", "architecture", "distributed", "concurrent", "asynchronous", "synchronization", "encryption", "authentication", "authorization", "application", "deployment", "development"] }
];

function generate(modWords, count) {
    let res = [];
    for (let i = 0; i < 5; i++) {
        let p = "";
        const shuffled = [...modWords].sort(() => Math.random() - 0.5);
        while (p.split(" ").length < count) {
            p += shuffled[Math.floor(Math.random() * shuffled.length)] + " ";
        }
        res.push(p.trim());
    }
    return res;
}

const finalModules = modules.map(m => {
    // For each module, its word pool should include preceding modules' words
    const prevWords = modules.slice(0, modules.indexOf(m)).reduce((acc, curr) => acc.concat(curr.words), []);
    const pool = [...new Set([...m.words, ...prevWords])];
    return {
        id: m.id,
        texts: generate(pool, 85)
    };
});

console.log(JSON.stringify(finalModules, null, 2));
