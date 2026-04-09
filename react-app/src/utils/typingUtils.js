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

/**
 * Generates a practice text based on an error map or weak keys array.
 * @param {Array|Object} weakKeys - List or Map of characters to practice
 * @param {number} durationInSeconds - Duration of the race to fill
 * @returns {string} 
 */
export const generateSmartDrill = (weakKeys = [], durationInSeconds = 30) => {
    // Convert to array if it's an error map
    let keys = Array.isArray(weakKeys) ? weakKeys : Object.keys(weakKeys);
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
