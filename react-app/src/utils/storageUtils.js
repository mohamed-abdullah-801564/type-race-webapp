import { auth } from '../firebase';

/**
 * Higher-order storage utility to handle Guest vs. Operator persistence.
 * If user is logged in, use localStorage.
 * If guest, use sessionStorage (cleared on tab close).
 */

export const saveData = (key, data) => {
    const storage = auth.currentUser ? localStorage : sessionStorage;
    storage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
};

export const loadData = (key, fallback = null) => {
    // We check both but prioritize the correct one based on auth
    const storage = auth.currentUser ? localStorage : sessionStorage;
    const data = storage.getItem(key);
    
    if (!data) return fallback;
    
    try {
        return JSON.parse(data);
    } catch {
        return data; // Return as string if not JSON
    }
};

export const clearAllData = () => {
    localStorage.clear();
    sessionStorage.clear();
};

export const getStorageType = () => {
    return auth.currentUser ? 'persistent' : 'session';
};
