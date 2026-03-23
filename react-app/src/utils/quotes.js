const quotes = [
    // ── Easy ─────────────────────────────────────────────────────────────────
    {
        text: 'the quick brown fox jumps over the lazy dog and rests by the river',
        difficulty: 'easy',
    },
    {
        text: 'she sells sea shells by the sea shore and the shells she sells are sea shells',
        difficulty: 'easy',
    },
    {
        text: 'how much wood would a woodchuck chuck if a woodchuck could chuck wood',
        difficulty: 'easy',
    },
    {
        text: 'the sun rises in the east and sets in the west every single day',
        difficulty: 'easy',
    },
    {
        text: 'a journey of a thousand miles begins with a single step forward',
        difficulty: 'easy',
    },
    {
        text: 'all that glitters is not gold and all who wander are not lost',
        difficulty: 'easy',
    },

    // ── Medium ────────────────────────────────────────────────────────────────
    {
        text: 'In the middle of difficulty lies opportunity. Keep your eyes on the stars, and your feet on the ground.',
        difficulty: 'medium',
    },
    {
        text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
        difficulty: 'medium',
    },
    {
        text: 'The only way to do great work is to love what you do. If you have not found it yet, keep looking.',
        difficulty: 'medium',
    },
    {
        text: 'It does not matter how slowly you go as long as you do not stop moving forward.',
        difficulty: 'medium',
    },
    {
        text: 'Believe you can and you are halfway there. The rest is discipline, patience, and hard work.',
        difficulty: 'medium',
    },
    {
        text: 'Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.',
        difficulty: 'medium',
    },

    // ── Hard ──────────────────────────────────────────────────────────────────
    {
        text: 'To print variables in JavaScript, use console.log("Hello, World!"); it is 100% effective and widely used.',
        difficulty: 'hard',
    },
    {
        text: 'The regex pattern /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/ validates e-mail addresses.',
        difficulty: 'hard',
    },
    {
        text: 'Run: git commit -m "fix: resolve #42 — null-pointer exception in user-auth module" && git push origin main.',
        difficulty: 'hard',
    },
    {
        text: 'HTTP status codes: 200 OK, 301 Moved Permanently, 404 Not Found, 500 Internal Server Error.',
        difficulty: 'hard',
    },
    {
        text: 'In Python, f-strings work like this: name = "World"; print(f"Hello, {name}!") — clean & fast.',
        difficulty: 'hard',
    },
    {
        text: 'She said, "It\'s 2 AM — why are you still coding?!" He replied: "Just one more bug... I swear."',
        difficulty: 'hard',
    },
];

/**
 * Returns a random quote string for the given difficulty level.
 * Falls back to 'medium' if no quotes are found.
 * @param {'easy' | 'medium' | 'hard'} difficulty
 * @returns {string}
 */
export const getRandomQuote = (difficulty = 'medium') => {
    const pool = quotes.filter(q => q.difficulty === difficulty);
    const source = pool.length > 0 ? pool : quotes.filter(q => q.difficulty === 'medium');
    return source[Math.floor(Math.random() * source.length)].text;
};

export default quotes;
