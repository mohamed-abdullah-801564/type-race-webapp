import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { validateWPM, validateAccuracy } from './sanitizeUtils';

/**
 * Robustly synchronizes personal best to the leaderboard.
 * Only updates if the new score is better than the existing one.
 * @param {number} wpm - Words per minute
 * @param {number|string} acc - Accuracy percentage
 */
export const syncToLeaderboard = async (wpm, acc) => {
    if (!validateWPM(wpm) || !validateAccuracy(parseFloat(acc))) { console.warn('Invalid WPM or accuracy rejected'); return false; }
    if (!auth.currentUser) return;
    
    try {
        const uid = auth.currentUser.uid;
        const userLBRef = doc(db, 'leaderboard', uid);
        const userLBSnap = await getDoc(userLBRef);
        
        let shouldUpdate = true;
        const numericAcc = parseFloat(acc);

        if (userLBSnap.exists()) {
            const existing = userLBSnap.data();
            const existingWPM = existing.wpm || 0;
            const existingAcc = existing.acc || 0;

            // Better WPM OR Same WPM with Better Accuracy
            if (wpm < existingWPM) {
                shouldUpdate = false;
            } else if (wpm === existingWPM && numericAcc <= existingAcc) {
                shouldUpdate = false;
            }
        }

        if (shouldUpdate) {
            const operatorName = localStorage.getItem('playerName') || auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
            
            await setDoc(userLBRef, {
                name: operatorName,
                wpm: wpm,
                acc: numericAcc,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            console.log("Leaderboard updated with new PB:", { wpm, acc: numericAcc });
            return true;
        }
    } catch (err) {
        console.error("Failed to sync to leaderboard:", err);
    }
    return false;
};

/**
 * Calculates current rank based on WPM.
 * @param {number} wpm 
 */
export const calculateRank = (wpm) => {
    if (wpm >= 111) return { tier: 'Overlord', score: 5000 + (wpm * 10), nextTierMax: null };
    if (wpm >= 81) return { tier: 'Elite', score: 3000 + (wpm * 8), nextTierMax: 5000 };
    if (wpm >= 51) return { tier: 'Pro', score: 1500 + (wpm * 6), nextTierMax: 3000 };
    if (wpm >= 31) return { tier: 'Cadet', score: 500 + (wpm * 4), nextTierMax: 1500 };
    return { tier: 'Novice', score: wpm * 2, nextTierMax: 500 };
};

/**
 * Pushes ONLY CRUCIAL stats to Firestore to minimize writes (Free Tier Optimization).
 * Updates highestWPM and Leaderboard ONLY if the new WPM is strictly better.
 * Always increments totalRaces.
 * Does NOT sync raceHistory or weakKeys (local-only).
 */
export const syncCrucialData = async (finalWpm, finalAcc) => {
    if (!validateWPM(finalWpm) || !validateAccuracy(parseFloat(finalAcc))) { console.warn('Invalid WPM or accuracy rejected'); return false; }
    if (!auth.currentUser) return;

    try {
        const uid = auth.currentUser.uid;
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.data() || {};
        const existingRank = userData.rank || { highestWPM: 0, avgAcc: 0, totalRaces: 0 };
        const recentHistory = userData.recentHistory || [];
        
        let isNewPB = false;
        
        if (finalWpm > existingRank.highestWPM) {
            isNewPB = true;
        } else if (finalWpm === existingRank.highestWPM && parseFloat(finalAcc) > parseFloat(existingRank.avgAcc || 0)) {
            isNewPB = true;
        }

        const operatorName = localStorage.getItem('playerName') || auth.currentUser.displayName || auth.currentUser.email.split('@')[0];

        const newRace = { wpm: finalWpm, accuracy: parseFloat(finalAcc), timestamp: Date.now() };
        const updatedHistory = [...recentHistory, newRace].slice(-15);

        // 2. Prepare atomic update
        const updatePayload = {
            "rank.totalRaces": increment(1),
            lastActive: serverTimestamp(),
            operatorName: operatorName,
            recentHistory: updatedHistory
        };

        if (isNewPB) {
            const rankInfo = calculateRank(finalWpm);
            updatePayload['rank.highestWPM'] = finalWpm;
            updatePayload['rank.avgAcc'] = finalAcc;
            updatePayload['rank.tier'] = rankInfo.tier;
            updatePayload['rank.score'] = rankInfo.score;
            updatePayload['rank.nextTierMax'] = rankInfo.nextTierMax;
            
            // Sync to leaderboard only on PB
            await syncToLeaderboard(finalWpm, finalAcc);
        }

        await updateDoc(userDocRef, updatePayload);
        
        console.log(isNewPB ? "New PB Synced to Cloud!" : "Race incremented in Cloud.");
        return true;
    } catch (err) {
        console.error("Crucial sync failed:", err);
        return false;
    }
};

/**
 * @deprecated Use syncCrucialData instead
 */
export const pushStatsToCloud = syncCrucialData;

/**
 * Keeps track of up to 10 most missed keys across all sessions
 * stored remotely in trainings/{uid}.
 */
export const updateWeakKeys = async (errorMap) => {
    if (!auth.currentUser || !errorMap || Object.keys(errorMap).length === 0) return;
    try {
        const uid = auth.currentUser.uid;
        const trainingsRef = doc(db, 'trainings', uid);
        const trainingsSnap = await getDoc(trainingsRef);
        
        const existingKeys = trainingsSnap.exists() ? (trainingsSnap.data().keys || {}) : {};
        
        for (const [key, count] of Object.entries(errorMap)) {
            if (!existingKeys[key]) existingKeys[key] = 0;
            existingKeys[key] += count;
        }

        const sortedKeys = Object.entries(existingKeys)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
            
        const top10Keys = Object.fromEntries(sortedKeys);

        await setDoc(trainingsRef, {
            keys: top10Keys,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        console.log("Synced weak keys to trainings collection.");
    } catch (err) {
        console.error("Failed to sync weak keys:", err);
    }
};
