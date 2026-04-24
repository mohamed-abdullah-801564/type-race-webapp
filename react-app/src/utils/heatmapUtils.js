const TRACKED_KEYS = new Set([
    ...'abcdefghijklmnopqrstuvwxyz',
    ...'0123456789',
    ...'{}[];:,./-=<>!*?&|^~"\'`'.split('')
]);

/**
 * Validates if a character is within the tracked set for heatmap recording.
 * Spaces are intentionally excluded.
 * @param {string} char 
 * @returns {boolean}
 */
export const isTrackableKey = (char) => {
    if (!char || char.length !== 1 || char === ' ') return false;
    return TRACKED_KEYS.has(char.toLowerCase());
};

/**
 * Records the latency of a specific keystroke and updates its rolling average performance.
 * Persistently stores the data locally in localStorage.
 * @param {string} char - The character typed
 * @param {number} latencyMs - The time in milliseconds between the previous and current keystroke
 */
export const recordKeyLatency = (char, latencyMs) => {
    try {
        // Validation Checks
        if (!isTrackableKey(char)) return;

        // Sanity clamp: Ignore outliers (e.g., initial char delays or pauses > 3s)
        if (latencyMs < 20 || latencyMs > 3000) return;

        const key = char.toLowerCase();
        
        // Load existing performance map
        const storedData = localStorage.getItem('keyPerformances');
        const performanceMap = storedData ? JSON.parse(storedData) : {};

        // Retrieve or initialize entry
        const existing = performanceMap[key] || { avg: 0, count: 0 };
        
        // Calculate new rolling average
        const newCount = existing.count + 1;
        const newAvg = existing.avg + (latencyMs - existing.avg) / newCount;

        // Update map
        performanceMap[key] = {
            avg: Math.round(newAvg),
            count: newCount
        };

        // Save back to local storage
        localStorage.setItem('keyPerformances', JSON.stringify(performanceMap));

    } catch (err) {
        console.warn("Neural Heatmap: Failed to update local key performance data.", err);
    }
};
