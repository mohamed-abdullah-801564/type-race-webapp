/**
 * Typing Utilities for TypeMaster
 */

// Mapping of common characters to practice words for adaptive drill generation
const CHAR_TO_WORDS = {
    'a': ['algorithm', 'async', 'await', 'access'],
    'b': ['buffer', 'binary', 'boolean', 'backend'],
    'c': ['cloud', 'compiler', 'constant', 'callback'],
    'd': ['data', 'debugger', 'deployment', 'database'],
    'e': ['effect', 'examine', 'execute', 'encryption'],
    'f': ['function', 'frontend', 'filesystem', 'fetch'],
    'g': ['global', 'gradient', 'gateway', 'grid'],
    'h': ['history', 'header', 'heatmap', 'handle'],
    'i': ['interface', 'identity', 'instance', 'integer'],
    'j': ['javascript', 'json', 'join', 'jump'],
    'k': ['keystroke', 'kernel', 'keyboard', 'kinetic'],
    'l': ['logic', 'leaderboard', 'latency', 'local'],
    'm': ['matrix', 'mutation', 'mapping', 'module'],
    'n': ['neural', 'network', 'node', 'numeric'],
    'o': ['operator', 'object', 'offline', 'optimization'],
    'p': ['protocol', 'parallel', 'pointer', 'pattern'],
    'q': ['query', 'queue', 'quality', 'quantize'],
    'r': ['react', 'resource', 'runtime', 'recursive'],
    's': ['sync', 'synthetic', 'storage', 'server'],
    't': ['temporal', 'transition', 'timestamp', 'token'],
    'u': ['utility', 'update', 'user', 'unique'],
    'v': ['vault', 'virtual', 'variable', 'version'],
    'w': ['websocket', 'window', 'worker', 'wrapper'],
    'x': ['xml', 'xor', 'execute', 'proxy'],
    'y': ['yield', 'yaml', 'yesterday', 'yellow'],
    'z': ['zoom', 'zinc', 'zone', 'zero'],
    ';': ['status;', 'data;', 'config;', 'link;'],
    '{': ['{data}', '{state}', '{node}', '{sync}'],
    '(': ['(id)', '(u)', '(event)', '(race)'],
    '.': ['this.data', 'user.uid', 'db.ref', 'auth.user']
};

export const ACADEMY_MODULES = [
    {
        id: 'mod_1',
        title: 'Home Row Basics',
        description: 'Establish the core foundation. Your fingers rest here for a reason.',
        keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        text: 'asdf jkl; asdf jkl; a s d f j k l ; sad lad fad glass falls flask dads lads fads',
        difficulty: 'easy'
    },
    {
        id: 'mod_2',
        title: 'Home Row Mastery',
        description: 'Conquer the center column. Stretch your index fingers to reach the inner keys.',
        keys: ['G', 'H'],
        text: 'gh gh g h g h agh hash slag flash glad half hall hand hang hang hash glass',
        difficulty: 'easy'
    },
    {
        id: 'mod_3',
        title: 'Top Row Introduction',
        description: 'The upper deck. Focus on upward precision without moving your wrists.',
        keys: ['Q', 'W', 'E', 'R', 'Y', 'U', 'I', 'O', 'P'],
        text: 'qwertyuiop power trip wire tree root water outer upper quite write petty properly',
        difficulty: 'medium'
    },
    {
        id: 'mod_4',
        title: 'Top Row Mastery',
        description: 'Focus on the "T" reach. One of the most common characters in the lexicon.',
        keys: ['T'],
        text: 't t t t that this then they there their them those these through thought things',
        difficulty: 'medium'
    },
    {
        id: 'mod_5',
        title: 'Bottom Row Basics',
        description: 'Descent into the lower grid. Master the downward stretch.',
        keys: ['Z', 'X', 'C', 'V', 'M', ',', '.', '/'],
        text: 'zxcv m,./ zone xenon cabin valve basic navy macro vacuum carbon convex vanish zebra',
        difficulty: 'medium'
    },
    {
        id: 'mod_6',
        title: 'Bottom Row Mastery',
        description: 'The index finger descent. Precision timing for "B" and "N".',
        keys: ['B', 'N'],
        text: 'bn bn b n b n bank bend bone born burn basic bench block branch bright broken',
        difficulty: 'medium'
    },
    {
        id: 'mod_7',
        title: 'Shift & Capitalization',
        description: 'Neural synchronization for upper-case characters. Master the dual-hand shift.',
        keys: ['SHIFT'],
        text: 'The Quick Brown Fox Jumps Over The Lazy Dog. Project Archive: GHOST_VAULT.',
        difficulty: 'medium'
    },
    {
        id: 'mod_8',
        title: 'Numbers & Math',
        description: 'Numerical data entry. Quantize your input with the top row numbers.',
        keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', '='],
        text: '123 + 456 = 579; 100 - 20 = 80; The ratio is 50/50. Error Code: 404. Status: 200.',
        difficulty: 'hard'
    },
    {
        id: 'mod_9',
        title: 'Developer Syntax',
        description: 'The developer protocol. Master the structural symbols of the grid.',
        keys: ['{', '}', '[', ']', '(', ')', ';', '<', '>', '/'],
        text: 'if (data.isValid) { return [state, { type: "SYNC" }]; } <div className="grid" />',
        difficulty: 'hard'
    },
    {
        id: 'mod_10',
        title: 'The Final Exam',
        description: 'The ultimate synthesis. Aggregate all protocols for maximum throughput.',
        keys: ['ALL'],
        text: 'const ghost = await captureNeuralState(); if (ghost.wpm > 120) { alert("Legendary!"); } return { ...state, active: true };',
        difficulty: 'hard'
    }
];

/**
 * Generates a practice text based on an error map or weak keys array.
 * @param {Array|Object} weakKeys - List or Map of characters to practice
 * @param {number} durationInSeconds - Duration of the race to fill
 * @returns {string} 
 */
export const generateSmartDrill = (weakKeys = [], durationInSeconds = 30) => {
    // Convert to array if it's an error map or single string
    let keys = [];
    if (typeof weakKeys === 'string') {
        keys = [weakKeys];
    } else {
        keys = Array.isArray(weakKeys) ? weakKeys : Object.keys(weakKeys);
    }
    keys = keys.filter(k => typeof k === 'string' && k.length === 1);

    const SYMBOLS = ['{', '}', ';', '[', ']', '(', ')', '<', '>', '/', '=', '+'];
    
    // 1. Determine the core character pool
    let pool = [];
    if (keys.length === 0) {
        pool = SYMBOLS;
    } else {
        // If we have weak keys, mix them with common characters to form words
        pool = keys;
    }

    // 2. Constants for text length
    const TARGET_WPM = 80;
    const wordsNeeded = Math.ceil((TARGET_WPM / 60) * durationInSeconds) + 5; // Add buffer

    const drillWords = [];
    
    // 3. Generate words
    for (let i = 0; i < wordsNeeded; i++) {
        const char = pool[Math.floor(Math.random() * pool.length)];
        const words = CHAR_TO_WORDS[char.toLowerCase()];
        
        if (words && words.length > 0) {
            drillWords.push(words[Math.floor(Math.random() * words.length)]);
        } else {
            // Fallback for symbols or keys without dictionary: generate pseudo-word
            const common = ['e', 't', 'o', 'i', 'n'];
            const pseudo = char + common[Math.floor(Math.random() * common.length)] + char;
            drillWords.push(pseudo);
        }
    }

    // 4. Shuffle and join
    return drillWords.sort(() => 0.5 - Math.random()).join(' ');
};

/**
 * @deprecated Use generateSmartDrill instead
 */
export const generateDrillText = (errorMap) => generateSmartDrill(errorMap, 30);
